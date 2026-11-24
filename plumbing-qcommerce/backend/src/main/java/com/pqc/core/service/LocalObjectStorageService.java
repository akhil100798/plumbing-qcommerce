package com.pqc.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@Slf4j
public class LocalObjectStorageService implements ObjectStorageService {

    private final Path storagePath;

    @Autowired
    public LocalObjectStorageService(@Value("${app.photos.storage-dir:uploads/service-order-photos}") String storageDir) {
        this.storagePath = Path.of(storageDir).toAbsolutePath().normalize();
    }

    public LocalObjectStorageService(Path storagePath) {
        this.storagePath = storagePath.toAbsolutePath().normalize();
    }

    @Override
    public void store(String storageKey, MultipartFile file) throws IOException {
        Path target = storagePath.resolve(storageKey).normalize();
        if (!target.startsWith(storagePath)) {
            throw new SecurityException("Directory traversal attempt: " + storageKey);
        }
        Files.createDirectories(target.getParent());
        file.transferTo(target);
        log.info("Stored file locally at: {}", target);
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        Path target = storagePath.resolve(storageKey).normalize();
        if (!target.startsWith(storagePath)) {
            throw new SecurityException("Directory traversal attempt: " + storageKey);
        }
        Resource resource = new UrlResource(target.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new FileNotFoundException("Local photo file not found: " + storageKey);
        }
        return resource;
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Path target = storagePath.resolve(storageKey).normalize();
        if (target.startsWith(storagePath)) {
            Files.deleteIfExists(target);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        Path target = storagePath.resolve(storageKey).normalize();
        return target.startsWith(storagePath) && Files.exists(target);
    }

    @Override
    public boolean isRemote() {
        return false;
    }

    public Path getStoragePath() {
        return storagePath;
    }
}
