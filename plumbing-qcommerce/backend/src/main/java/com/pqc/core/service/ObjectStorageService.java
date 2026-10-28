package com.pqc.core.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ObjectStorageService {
    void store(String storageKey, MultipartFile file) throws IOException;
    Resource load(String storageKey) throws IOException;
    void delete(String storageKey) throws IOException;
    boolean exists(String storageKey);
    boolean isRemote();
}
