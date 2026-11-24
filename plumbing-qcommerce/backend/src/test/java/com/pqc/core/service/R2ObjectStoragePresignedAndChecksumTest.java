package com.pqc.core.service;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class R2ObjectStoragePresignedAndChecksumTest {

    @TempDir
    Path tempDir;

    private LocalObjectStorageService localStorage;
    private HttpServer mockR2Server;
    private int mockPort;
    private byte[] testPayload;
    private String testPayloadSha256;

    @BeforeEach
    void setUp() throws IOException {
        localStorage = new LocalObjectStorageService(tempDir);
        testPayload = "Hello Cloudflare R2 Pre-Signed S3 V4 & SHA-256 Validation!".getBytes(StandardCharsets.UTF_8);
        testPayloadSha256 = AwsSigV4Signer.calculateSha256Hex(testPayload);

        mockR2Server = HttpServer.create(new InetSocketAddress(0), 0);
        mockPort = mockR2Server.getAddress().getPort();
        mockR2Server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                String path = exchange.getRequestURI().getPath();
                if (path.contains("corrupted-checksum")) {
                    exchange.getResponseHeaders().set("x-amz-checksum-sha256", "0000000000000000000000000000000000000000000000000000000000000000");
                    exchange.sendResponseHeaders(200, testPayload.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(testPayload); }
                } else if (path.contains("valid-checksum")) {
                    exchange.getResponseHeaders().set("x-amz-checksum-sha256", testPayloadSha256);
                    exchange.sendResponseHeaders(200, testPayload.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(testPayload); }
                } else {
                    exchange.sendResponseHeaders(200, testPayload.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(testPayload); }
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
    void generatePresignedUploadUrl_whenUnconfigured_returnsSafeSimulatedS3V4Url() {
        R2ObjectStorageService unconfigured = new R2ObjectStorageService(
                "local", false, "", "", "", "", "auto", localStorage
        );

        String url = unconfigured.generatePresignedUploadUrl("test-photo-sim.jpg", "image/jpeg", 900);

        assertThat(url).isNotNull();
        assertThat(url).contains("https://r2-simulated.fixkart.internal/");
        assertThat(url).contains("test-photo-sim.jpg");
        assertThat(url).contains("X-Amz-Algorithm=AWS4-HMAC-SHA256");
        assertThat(url).contains("X-Amz-Expires=900");
        assertThat(url).contains("X-Amz-Signature=");
    }

    @Test
    void generatePresignedUploadUrl_whenConfigured_generatesRealS3V4Url() {
        R2ObjectStorageService configured = new R2ObjectStorageService(
                "r2", true,
                "https://myaccount.r2.cloudflarestorage.com",
                "production-photos",
                "AKIAIOSFODNN7EXAMPLE",
                "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                "auto",
                localStorage
        );

        String url = configured.generatePresignedUploadUrl("customer/before-photo.jpg", "image/jpeg", 3600);

        assertThat(url).isNotNull();
        assertThat(url).startsWith("https://myaccount.r2.cloudflarestorage.com/production-photos/customer/before-photo.jpg?");
        assertThat(url).contains("X-Amz-Algorithm=AWS4-HMAC-SHA256");
        assertThat(url).contains("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F");
        assertThat(url).contains("X-Amz-Expires=3600");
        assertThat(url).contains("X-Amz-SignedHeaders=host");
        assertThat(url).contains("&X-Amz-Signature=");
    }

    @Test
    void load_withValidSha256ChecksumHeader_succeeds() throws IOException {
        String endpoint = "http://127.0.0.1:" + mockPort;
        R2ObjectStorageService service = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "mybucket",
                "key",
                "secret",
                "auto",
                localStorage
        );

        Resource resource = service.load("valid-checksum.jpg");

        assertThat(resource).isNotNull();
        assertThat(resource.getContentAsByteArray()).isEqualTo(testPayload);
    }

    @Test
    void load_withCorruptedSha256ChecksumHeader_throwsIntegrityViolation() {
        String endpoint = "http://127.0.0.1:" + mockPort;
        R2ObjectStorageService service = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "mybucket",
                "key",
                "secret",
                "auto",
                localStorage
        );

        assertThatThrownBy(() -> service.load("corrupted-checksum.jpg"))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("Integrity violation: SHA-256 checksum mismatch");
    }

    @Test
    void loadAndVerifySha256_withMatchingHash_succeeds() throws IOException {
        String endpoint = "http://127.0.0.1:" + mockPort;
        R2ObjectStorageService service = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "mybucket",
                "key",
                "secret",
                "auto",
                localStorage
        );

        Resource resource = service.loadAndVerifySha256("test-object.jpg", testPayloadSha256);

        assertThat(resource.getContentAsByteArray()).isEqualTo(testPayload);
    }

    @Test
    void loadAndVerifySha256_withMismatchedHash_throwsIntegrityViolation() {
        String endpoint = "http://127.0.0.1:" + mockPort;
        R2ObjectStorageService service = new R2ObjectStorageService(
                "r2", true,
                endpoint,
                "mybucket",
                "key",
                "secret",
                "auto",
                localStorage
        );

        assertThatThrownBy(() -> service.loadAndVerifySha256("test-object.jpg", "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("Integrity violation: SHA-256 checksum mismatch");
    }
}
