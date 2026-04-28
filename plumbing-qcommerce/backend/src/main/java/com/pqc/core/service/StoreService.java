package com.pqc.core.service;

import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserService userService;

    public Store createStore(Store store, String managerEmail) {
        User manager = userService.getUserByEmail(managerEmail);
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
