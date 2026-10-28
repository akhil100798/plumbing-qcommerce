package com.pqc.core.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
@Primary
@Slf4j
public class R2ObjectStorageService implements ObjectStorageService {

    private final String provider;
    private final boolean failIfMissingProvider;
    private final String endpoint;
    private final String bucket;
    private final String accessKey;
    private final String secretKey;
    private final String region;
    private final LocalObjectStorageService localFallback;
    private final HttpClient httpClient;

    @Autowired
    public R2ObjectStorageService(
            @Value("${app.photos.provider:local}") String provider,
            @Value("${app.photos.fail-if-missing-provider:false}") boolean failIfMissingProvider,
            @Value("${app.photos.r2.endpoint:}") String endpoint,
            @Value("${app.photos.r2.bucket:}") String bucket,
            @Value("${app.photos.r2.access-key:${app.photos.r2.access-key-id:}}") String accessKey,
            @Value("${app.photos.r2.secret-key:${app.photos.r2.secret-access-key:}}") String secretKey,
            @Value("${app.photos.r2.region:auto}") String region,
            @Value("${app.photos.r2.account-id:}") String accountId,
            LocalObjectStorageService localFallback) {
        this.provider = provider != null ? provider.trim().toLowerCase() : "local";
        this.failIfMissingProvider = failIfMissingProvider;

        String b = bucket != null ? bucket.trim() : "";
        String ep = endpoint != null ? endpoint.trim() : "";
        if (ep.isBlank() && accountId != null && !accountId.isBlank()) {
            ep = "https://" + accountId.trim() + ".r2.cloudflarestorage.com";
        }

        // Sanitize endpoint: strip trailing slashes and strip redundant bucket suffix if present
        while (ep.endsWith("/")) {
            ep = ep.substring(0, ep.length() - 1);
        }
        if (!b.isBlank() && ep.endsWith("/" + b)) {
            ep = ep.substring(0, ep.length() - ("/" + b).length());
        }
        while (ep.endsWith("/")) {
            ep = ep.substring(0, ep.length() - 1);
        }

        this.endpoint = ep;
        this.bucket = b;
        this.accessKey = accessKey != null ? accessKey.trim() : "";
        this.secretKey = secretKey != null ? secretKey.trim() : "";
        this.region = (region != null && !region.isBlank()) ? region.trim() : "auto";
        this.localFallback = localFallback;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (isConfigured()) {
            log.info("[STORAGE-CONFIG] Cloudflare R2 object storage ENABLED (bucket: '{}', endpoint: '{}', region: '{}')",
                    this.bucket, this.endpoint, this.region);
        } else if (isRemoteRequired()) {
            log.error("[STORAGE-CONFIG] Cloudflare R2 is required (provider='{}', failIfMissing={}) but credentials/configuration are incomplete!",
                    this.provider, this.failIfMissingProvider);
        } else {
            log.info("[STORAGE-CONFIG] Local object storage active (provider='{}', fallback to local disk).", this.provider);
        }
    }

    public R2ObjectStorageService(
            String provider,
            boolean failIfMissingProvider,
            String endpoint,
            String bucket,
            String accessKey,
            String secretKey,
            String region,
            LocalObjectStorageService localFallback) {
        this(provider, failIfMissingProvider, endpoint, bucket, accessKey, secretKey, region, "", localFallback);
    }

    public boolean isRemoteRequired() {
        return "r2".equalsIgnoreCase(provider) || failIfMissingProvider;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (isRemoteRequired() && !isConfigured()) {
            throw new IllegalStateException(
                    "[STORAGE-CONFIG] Cloudflare R2 object storage is required (app.photos.provider=" + provider
                            + ", app.photos.fail-if-missing-provider=" + failIfMissingProvider
                            + "), but R2 configuration (endpoint, bucket, accessKey, secretKey) is missing or incomplete. Startup aborted.");
        }
    }

    public boolean isConfigured() {
        return !endpoint.isBlank() && !bucket.isBlank() && !accessKey.isBlank() && !secretKey.isBlank();
    }

    @Override
    public boolean isRemote() {
        return isConfigured();
    }

    @Override
    public void store(String storageKey, MultipartFile file) throws IOException {
        if (!isConfigured()) {
            if (isRemoteRequired()) {
                throw new IllegalStateException("Cloudflare R2 storage required but not configured; refusing silent local fallback in cloud staging.");
            }
            localFallback.store(storageKey, file);
            return;
        }

        byte[] bytes = file.getBytes();
        String uriPath = "/" + bucket + "/" + storageKey;
        URI fullUri = URI.create(endpoint + uriPath);
        String host = fullUri.getHost() + (fullUri.getPort() != -1 ? ":" + fullUri.getPort() : "");

        Map<String, String> signedHeaders = AwsSigV4Signer.sign(
                "PUT", uriPath, bytes, host, region, "s3", accessKey, secretKey);

        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(fullUri)
                .timeout(Duration.ofSeconds(30))
                .PUT(HttpRequest.BodyPublishers.ofByteArray(bytes));

        signedHeaders.forEach((k, v) -> {
            if (!"Host".equalsIgnoreCase(k)) {
                reqBuilder.header(k, v);
            }
        });
        if (file.getContentType() != null) {
            reqBuilder.header("Content-Type", file.getContentType());
        }

        try {
            HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully uploaded photo to Cloudflare R2: {}/{}", bucket, storageKey);
            } else {
                throw new IOException("Failed to upload object to Cloudflare R2 (status " + response.statusCode() + "): " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Cloudflare R2 upload interrupted", e);
        }
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        if (!isConfigured()) {
            if (isRemoteRequired()) {
                throw new IllegalStateException("Cloudflare R2 storage required but not configured; refusing silent local fallback in cloud staging.");
            }
            return localFallback.load(storageKey);
        }

        String uriPath = "/" + bucket + "/" + storageKey;
        URI fullUri = URI.create(endpoint + uriPath);
        String host = fullUri.getHost() + (fullUri.getPort() != -1 ? ":" + fullUri.getPort() : "");

        Map<String, String> signedHeaders = AwsSigV4Signer.sign(
                "GET", uriPath, new byte[0], host, region, "s3", accessKey, secretKey);

        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(fullUri)
                .timeout(Duration.ofSeconds(15))
                .GET();

        signedHeaders.forEach((k, v) -> {
            if (!"Host".equalsIgnoreCase(k)) {
                reqBuilder.header(k, v);
            }
        });

        try {
            HttpResponse<byte[]> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 200) {
                return new ByteArrayResource(response.body());
            } else if (response.statusCode() == 404) {
                throw new FileNotFoundException("Photo not found in Cloudflare R2: " + storageKey);
            } else {
                throw new IOException("Cloudflare R2 load failed with status " + response.statusCode());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Cloudflare R2 download interrupted", e);
        }
    }

    @Override
    public void delete(String storageKey) throws IOException {
        if (!isConfigured()) {
            if (isRemoteRequired()) {
                throw new IllegalStateException("Cloudflare R2 storage required but not configured; refusing silent local fallback in cloud staging.");
            }
            localFallback.delete(storageKey);
            return;
        }

        String uriPath = "/" + bucket + "/" + storageKey;
        URI fullUri = URI.create(endpoint + uriPath);
        String host = fullUri.getHost() + (fullUri.getPort() != -1 ? ":" + fullUri.getPort() : "");

        Map<String, String> signedHeaders = AwsSigV4Signer.sign(
                "DELETE", uriPath, new byte[0], host, region, "s3", accessKey, secretKey);

        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(fullUri)
                .timeout(Duration.ofSeconds(15))
                .DELETE();

        signedHeaders.forEach((k, v) -> {
            if (!"Host".equalsIgnoreCase(k)) {
                reqBuilder.header(k, v);
            }
        });

        try {
            HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            log.info("Cloudflare R2 delete {} status: {}", storageKey, response.statusCode());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Cloudflare R2 delete interrupted", e);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        if (!isConfigured()) {
            if (isRemoteRequired()) {
                return false;
            }
            return localFallback.exists(storageKey);
        }
        try {
            load(storageKey);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
