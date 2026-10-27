package com.pqc.core.service;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ObjectStorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalObjectStorageService localStorage;
    private HttpServer mockR2Server;
    private int mockR2Port;
    private final Map<String, byte[]> mockR2DataStore = new ConcurrentHashMap<>();

    @BeforeEach
    void setUp() throws IOException {
        localStorage = new LocalObjectStorageService(tempDir);
        mockR2DataStore.clear();

        // Start embedded HTTP server simulating Cloudflare R2 S3 REST endpoint
        mockR2Server = HttpServer.create(new InetSocketAddress(0), 0);
        mockR2Port = mockR2Server.getAddress().getPort();
        mockR2Server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                String auth = exchange.getRequestHeaders().getFirst("Authorization");
                String path = exchange.getRequestURI().getPath(); // e.g. /test-bucket/test.jpg
                String method = exchange.getRequestMethod();

                // Test invalid credentials / signature check
                if (auth == null || auth.contains("invalid-secret") || auth.contains("invalid-key")) {
                    byte[] err = ("<Error><Code>InvalidAccessKeyId</Code><Message>The AWS Access Key Id you provided does not exist in our records.</Message></Error>").getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/xml");
                    exchange.sendResponseHeaders(403, err.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(err); }
                    return;
                }

                if ("PUT".equalsIgnoreCase(method)) {
                    byte[] body = exchange.getRequestBody().readAllBytes();
                    mockR2DataStore.put(path, body);
                    exchange.getResponseHeaders().set("ETag", "\"d41d8cd98f00b204e9800998ecf8427e\"");
                    exchange.sendResponseHeaders(200, -1);
                } else if ("GET".equalsIgnoreCase(method)) {
                    byte[] data = mockR2DataStore.get(path);
                    if (data != null) {
                        exchange.getResponseHeaders().set("Content-Type", "image/jpeg");
                        exchange.sendResponseHeaders(200, data.length);
                        try (OutputStream os = exchange.getResponseBody()) { os.write(data); }
                    } else {
                        byte[] err = ("<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>").getBytes(StandardCharsets.UTF_8);
                        exchange.getResponseHeaders().set("Content-Type", "application/xml");
                        exchange.sendResponseHeaders(404, err.length);
                        try (OutputStream os = exchange.getResponseBody()) { os.write(err); }
                    }
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    mockR2DataStore.remove(path);
                    exchange.sendResponseHeaders(204, -1);
                } else {
                    exchange.sendResponseHeaders(405, -1);
                }
            }
        });
        mockR2Server.start();
    }

    @AfterEach
    void tearDown() {
        if (mockR2Server != null) {
            mockR2Server.stop(0);
        }
    }

    @Test
    void localStoreAndLoadSucceeds() throws IOException {
        MockMultipartFile file = new MockMultipartFile("photo", "test.jpg", "image/jpeg", new byte[]{10, 20, 30});
        String key = "test-photo-1.jpg";

        localStorage.store(key, file);
        assertThat(localStorage.exists(key)).isTrue();

        Resource loaded = localStorage.load(key);
        assertThat(loaded.exists()).isTrue();
        assertThat(loaded.isReadable()).isTrue();
        assertThat(loaded.getContentAsByteArray()).isEqualTo(new byte[]{10, 20, 30});
    }

    @Test
    void localDeleteRemovesFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("photo", "test.png", "image/png", new byte[]{1, 2});
        String key = "delete-me.png";

        localStorage.store(key, file);
        assertThat(localStorage.exists(key)).isTrue();

        localStorage.delete(key);
        assertThat(localStorage.exists(key)).isFalse();
    }

    @Test
    void localLoadThrowsFileNotFoundForMissingFile() {
        assertThatThrownBy(() -> localStorage.load("missing-file.jpg"))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessageContaining("missing-file.jpg");
    }

    @Test
    void localStoreRejectsDirectoryTraversal() {
        MockMultipartFile file = new MockMultipartFile("photo", "evil.jpg", "image/jpeg", new byte[]{1});
        assertThatThrownBy(() -> localStorage.store("../evil.jpg", file))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Directory traversal");
    }

    @Test
    void awsSigV4SignerGeneratesValidHeaders() {
        Map<String, String> signed = AwsSigV4Signer.sign(
                "PUT",
                "/test-bucket/test-key.jpg",
                "sample-content".getBytes(),
                "test-account.r2.cloudflarestorage.com",
                "auto",
                "s3",
                "test-access-key-id",
                "test-secret-access-key-12345"
        );

        assertThat(signed).containsKey("Authorization");
        assertThat(signed).containsKey("x-amz-date");
        assertThat(signed).containsKey("x-amz-content-sha256");
        assertThat(signed).containsKey("Host");

        assertThat(signed.get("Authorization")).startsWith("AWS4-HMAC-SHA256 Credential=test-access-key-id/");
        assertThat(signed.get("Authorization")).contains("SignedHeaders=host;x-amz-content-sha256;x-amz-date");
        assertThat(signed.get("Authorization")).contains("Signature=");
        assertThat(signed.get("x-amz-date")).matches("\\d{8}T\\d{6}Z");
    }

    @Test
    void r2StorageFallsBackToLocalInLocalProfileWhenUnconfigured() throws IOException {
        R2ObjectStorageService r2Service = new R2ObjectStorageService(
                "local", false, "", "", "", "", "auto", localStorage
        );

        assertThat(r2Service.isConfigured()).isFalse();
        assertThat(r2Service.isRemote()).isFalse();

        MockMultipartFile file = new MockMultipartFile("photo", "fallback.jpg", "image/jpeg", new byte[]{99, 88});
        r2Service.store("fallback.jpg", file);

        assertThat(r2Service.exists("fallback.jpg")).isTrue();
        Resource resource = r2Service.load("fallback.jpg");
        assertThat(resource.getContentAsByteArray()).isEqualTo(new byte[]{99, 88});

        r2Service.delete("fallback.jpg");
        assertThat(r2Service.exists("fallback.jpg")).isFalse();
    }

    @Test
    void r2StorageFailsFastOnStartupWhenMissingInStagingProfile() {
        R2ObjectStorageService r2Staging = new R2ObjectStorageService(
                "r2", true, "", "", "", "", "auto", localStorage
        );

        assertThatThrownBy(r2Staging::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cloudflare R2 object storage is required")
                .hasMessageContaining("Startup aborted");
    }

    @Test
    void r2StorageRefusesSilentFallbackWhenMissingInStagingProfile() {
        R2ObjectStorageService r2Staging = new R2ObjectStorageService(
                "r2", true, "", "", "", "", "auto", localStorage
        );

        MockMultipartFile file = new MockMultipartFile("photo", "test.jpg", "image/jpeg", new byte[]{1, 2});

        assertThatThrownBy(() -> r2Staging.store("test.jpg", file))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("refusing silent local fallback");

        assertThatThrownBy(() -> r2Staging.load("test.jpg"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("refusing silent local fallback");

        assertThatThrownBy(() -> r2Staging.delete("test.jpg"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("refusing silent local fallback");

        assertThat(r2Staging.exists("test.jpg")).isFalse();
    }

    @Test
    void r2StorageDetectsConfiguredState() {
        R2ObjectStorageService r2Configured = new R2ObjectStorageService(
                "r2", true,
                "https://test-account.r2.cloudflarestorage.com",
                "my-bucket",
                "accessKeyId",
                "secretAccessKey",
                "auto",
                localStorage
        );

        assertThat(r2Configured.isConfigured()).isTrue();
        assertThat(r2Configured.isRemote()).isTrue();
    }

    @Test
    void r2S3RestApiPutAndGetAndPersistenceVerification() throws IOException {
        String endpoint = "http://127.0.0.1:" + mockR2Port;
        R2ObjectStorageService r2 = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "staging-photos",
                "valid-staging-key-id",
                "valid-staging-secret-key-abcdef",
                "auto",
                localStorage
        );

        byte[] photoData = new byte[]{11, 22, 33, 44, 55};
        MockMultipartFile file = new MockMultipartFile("photo", "order-101.jpg", "image/jpeg", photoData);

        // 1. Verify PUT uploads to S3/R2
        r2.store("order-101.jpg", file);
        assertThat(mockR2DataStore).containsKey("/staging-photos/order-101.jpg");
        assertThat(mockR2DataStore.get("/staging-photos/order-101.jpg")).isEqualTo(photoData);

        // 2. Verify GET downloads from S3/R2
        Resource loaded = r2.load("order-101.jpg");
        assertThat(loaded.getContentAsByteArray()).isEqualTo(photoData);

        // 3. Verify exists()
        assertThat(r2.exists("order-101.jpg")).isTrue();

        // 4. Verify DELETE
        r2.delete("order-101.jpg");
        assertThat(r2.exists("order-101.jpg")).isFalse();
    }

    @Test
    void r2S3RestApiNonexistentObjectThrowsFileNotFound() {
        String endpoint = "http://127.0.0.1:" + mockR2Port;
        R2ObjectStorageService r2 = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "staging-photos",
                "valid-staging-key-id",
                "valid-staging-secret-key-abcdef",
                "auto",
                localStorage
        );

        assertThatThrownBy(() -> r2.load("nonexistent-photo.jpg"))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessageContaining("Photo not found in Cloudflare R2");
    }

    @Test
    void r2S3RestApiInvalidCredentialsThrowsIOExceptionWith403() {
        String endpoint = "http://127.0.0.1:" + mockR2Port;
        R2ObjectStorageService r2Invalid = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "staging-photos",
                "invalid-key-id",
                "invalid-secret-key",
                "auto",
                localStorage
        );

        MockMultipartFile file = new MockMultipartFile("photo", "order-999.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> r2Invalid.store("order-999.jpg", file))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("status 403")
                .hasMessageContaining("InvalidAccessKeyId");
    }
}
