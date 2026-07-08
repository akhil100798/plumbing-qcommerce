package com.pqc.core.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pqc.core.config.GoogleAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleTokenVerifierService {

    private final GoogleAuthProperties googleAuthProperties;

    public GoogleClaims verifyToken(String idTokenString) {
        if (!googleAuthProperties.isEnabled()) {
            throw new IllegalStateException("Google authentication is not enabled");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(googleAuthProperties.getAllowedClientIds() != null ? 
                    googleAuthProperties.getAllowedClientIds() : 
                    Collections.singletonList(googleAuthProperties.getWebClientId()))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                Boolean emailVerified = payload.getEmailVerified();
                if (emailVerified == null || !emailVerified) {
                    log.error("Google token email is not verified");
                    throw new IllegalArgumentException("Google account email must be verified");
                }

                String userId = payload.getSubject();
                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");

                return new GoogleClaims(userId, email, emailVerified, name, pictureUrl);
            } else {
                throw new IllegalArgumentException("Invalid Google ID token");
            }
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error verifying Google ID token", e);
            throw new IllegalArgumentException("Failed to verify Google ID token: " + e.getMessage());
        }
    }

    public record GoogleClaims(
            String sub,
            String email,
            boolean emailVerified,
            String name,
            String picture
    ) {}
}
