package com.pqc.core.service;

import com.pqc.core.entity.Store;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserService userService;
    private final CurrentUser currentUser;

    public Store createStore(Store store, String managerEmail) {
        User actor = currentUser.require();
        if (actor.getRole() == Role.STORE_MANAGER && !actor.getEmail().equalsIgnoreCase(managerEmail)) {
            throw new AccessDeniedException("Store managers may create stores only for themselves");
        }
        if (actor.getRole() != Role.STORE_MANAGER && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only store managers or administrators may create stores");
        }
        User manager = userService.getUserByEmail(managerEmail);
        if (manager.getRole() != Role.STORE_MANAGER) {
            throw new AccessDeniedException("Store manager account is required");
        }
        store.setManager(manager);
        return storeRepository.save(store);
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public Store getStoreById(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with ID: " + id));
    }
}
