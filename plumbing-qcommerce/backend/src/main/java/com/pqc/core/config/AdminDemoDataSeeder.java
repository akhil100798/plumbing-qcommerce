package com.pqc.core.config;

import com.pqc.core.entity.BannerPlacement;
import com.pqc.core.entity.BeneficiaryType;
import com.pqc.core.entity.CampaignStatus;
import com.pqc.core.entity.CampaignType;
import com.pqc.core.entity.DiscountType;
import com.pqc.core.entity.MarketingBanner;
import com.pqc.core.entity.MarketingCampaign;
import com.pqc.core.entity.MarketingNotification;
import com.pqc.core.entity.MarketingNotificationStatus;
import com.pqc.core.entity.Offer;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PlumberAvailabilityStatus;
import com.pqc.core.entity.PlumberKyc;
import com.pqc.core.entity.PlumberKycStatus;
import com.pqc.core.entity.Product;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderItem;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.RefundRequest;
import com.pqc.core.entity.RefundStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.Settlement;
import com.pqc.core.entity.SettlementStatus;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.SupportMessage;
import com.pqc.core.entity.SupportTicket;
import com.pqc.core.entity.SupportTicketCategory;
import com.pqc.core.entity.SupportTicketPriority;
import com.pqc.core.entity.SupportTicketStatus;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.entity.Wallet;
import com.pqc.core.repository.MarketingBannerRepository;
import com.pqc.core.repository.MarketingCampaignRepository;
import com.pqc.core.repository.MarketingNotificationRepository;
import com.pqc.core.repository.OfferRepository;
import com.pqc.core.repository.PlumberKycRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ProductRepository;
import com.pqc.core.repository.RefundRequestRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.SettlementRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.SupportMessageRepository;
import com.pqc.core.repository.SupportTicketRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("!test")
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class AdminDemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final ProductOrderRepository productOrderRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final WalletRepository walletRepository;
    private final SettlementRepository settlementRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final PlumberKycRepository plumberKycRepository;
    private final OfferRepository offerRepository;
    private final MarketingCampaignRepository marketingCampaignRepository;
    private final MarketingBannerRepository marketingBannerRepository;
    private final MarketingNotificationRepository marketingNotificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Store primaryStore = storeRepository.findAll().stream().findFirst().orElse(null);
        List<Product> products = productRepository.findAll();
        if (primaryStore == null || products.size() < 3) {
            log.info("Skipping admin demo seed because catalog baseline is not ready yet.");
            return;
        }

        log.info("Ensuring admin demo data for Phase 10...");

        User supportAdmin = ensureUser("support@plumbcommerce.com", "Demo Support Admin", "5555555505", Role.SUPPORT_ADMIN);
        User marketingAdmin = ensureUser("marketing@plumbcommerce.com", "Demo Marketing Admin", "5555555506", Role.MARKETING_ADMIN);

        User customer1 = ensureUser("anita.customer@plumbcommerce.com", "Anita Sharma", "7000000001", Role.CUSTOMER);
        User customer2 = ensureUser("rahul.customer@plumbcommerce.com", "Rahul Verma", "7000000002", Role.CUSTOMER);
        User customer3 = ensureUser("sneha.customer@plumbcommerce.com", "Sneha Iyer", "7000000003", Role.CUSTOMER);

        User plumber1 = ensureUser("vikram.plumber@plumbcommerce.com", "Vikram Patil", "7100000001", Role.PLUMBER);
        User plumber2 = ensureUser("arjun.plumber@plumbcommerce.com", "Arjun Nair", "7100000002", Role.PLUMBER);
        User plumber3 = ensureUser("imran.plumber@plumbcommerce.com", "Imran Shaikh", "7100000003", Role.PLUMBER);

        User storeManager2 = ensureUser("northstore.manager@plumbcommerce.com", "Neha Kulkarni", "7200000001", Role.STORE_MANAGER);
        User delivery1 = ensureUser("asha.delivery@plumbcommerce.com", "Asha More", "7300000001", Role.DELIVERY_PARTNER);
        User delivery2 = ensureUser("nitin.delivery@plumbcommerce.com", "Nitin Rao", "7300000002", Role.DELIVERY_PARTNER);

        Store secondStore = ensureStore("PlumbCommerce North Hub", "22 Ring Road, Pune", 18.5204, 73.8567, storeManager2);

        ensureWallet(customer1, "850.00");
        ensureWallet(customer2, "420.00");
        ensureWallet(customer3, "1260.00");
        ensureWallet(plumber1, "5400.00");
        ensureWallet(plumber2, "3800.00");
        ensureWallet(delivery1, "1450.00");
        ensureWallet(delivery2, "990.00");

        ensurePlumberKyc(plumber1, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.ONLINE, "Mumbai Central, Dadar", 7, null);
        ensurePlumberKyc(plumber2, PlumberKycStatus.PENDING, PlumberAvailabilityStatus.BUSY, "Pune City", 4, null);
        ensurePlumberKyc(plumber3, PlumberKycStatus.REJECTED, PlumberAvailabilityStatus.SUSPENDED, "Navi Mumbai", 5, "Bank proof mismatch");

        ServiceOrder deliveredService = ensureServiceOrder("Demo bathroom leak fix - completed and paid", customer1, plumber1, primaryStore, OrderStatus.PAID, RequestType.NEARBY_AUTO, "Customer reported a leaking bathroom pipeline and requested urgent repair.", "950.00", "250.00", "80.00", "1280.00");
        ServiceOrder activeJob = ensureServiceOrder("Demo terrace pipeline inspection - active", customer3, plumber2, primaryStore, OrderStatus.IN_PROGRESS, RequestType.DIRECT_PLUMBER, "Inspection for intermittent terrace water pressure issue.", "600.00", "0.00", "55.00", "655.00");
        ServiceOrder combinedJob = ensureServiceOrder("Demo geyser piping replacement - combined order", customer1, plumber2, secondStore, OrderStatus.COMBINED_ORDER, RequestType.STORE_ROUTED, "Plumber requested additional parts mid-job for geyser line replacement.", "820.00", "410.00", "70.00", "1300.00");
        ensureServiceOrder("Demo kitchen tap replacement - completed", customer2, plumber1, secondStore, OrderStatus.COMPLETED, RequestType.STORE_ROUTED, "Kitchen mixer tap replacement with new fittings.", "700.00", "320.00", "65.00", "1085.00");
        ensureServiceOrder("Demo sink blockage follow-up - pending", customer2, null, primaryStore, OrderStatus.PENDING, RequestType.NEARBY_AUTO, "Pending assignment for repeated kitchen sink blockage.", "450.00", "0.00", "35.00", "485.00");

        Product product1 = products.get(0);
        Product product2 = products.get(1);
        Product product3 = products.get(2);

        ProductOrder deliveredOrder = ensureProductOrder("D001", customer1, primaryStore, ProductOrderStatus.DELIVERED, delivery1, null, LocalDateTime.now().minusHours(2), List.of(item(product1, 4, "15.50"), item(product3, 2, "2.50")));
        ensureProductOrder("D002", customer2, primaryStore, ProductOrderStatus.OUT_FOR_DELIVERY, delivery2, null, LocalDateTime.now().minusHours(6), List.of(item(product2, 3, "12.00"), item(product3, 4, "2.50")));
        ensureProductOrder("D003", customer3, secondStore, ProductOrderStatus.PACKING, null, null, LocalDateTime.now().plusHours(2), List.of(item(product1, 2, "15.50"), item(product2, 2, "12.00")));
        ensureProductOrder("D004", customer1, secondStore, ProductOrderStatus.CONFIRMED, null, null, LocalDateTime.now().plusHours(4), List.of(item(product2, 1, "12.00"), item(product3, 6, "2.50")));
        ensureProductOrder("D005", customer2, primaryStore, ProductOrderStatus.PENDING, null, null, LocalDateTime.now().plusHours(5), List.of(item(product1, 1, "15.50"), item(product3, 3, "2.50")));
        ProductOrder materialOrder = ensureProductOrder("D006", customer1, secondStore, ProductOrderStatus.CONFIRMED, null, combinedJob, LocalDateTime.now().plusHours(1), List.of(item(product1, 5, "15.50"), item(product2, 3, "12.00")));
        ensureProductOrder("D007", customer3, primaryStore, ProductOrderStatus.CANCELLED, null, null, LocalDateTime.now().minusHours(1), List.of(item(product2, 2, "12.00")));
        ensureProductOrder("D008", customer2, secondStore, ProductOrderStatus.FAILED, null, null, LocalDateTime.now().minusHours(1), List.of(item(product3, 10, "2.50")));

        ensureSettlement(BeneficiaryType.STORE, primaryStore.getId(), "2840.00", "284.00", "2556.00", SettlementStatus.PENDING, null);
        ensureSettlement(BeneficiaryType.STORE, secondStore.getId(), "1985.00", "198.50", "1786.50", SettlementStatus.PAID, LocalDateTime.now().minusDays(1));
        ensureSettlement(BeneficiaryType.PLUMBER, plumber1.getId(), "2365.00", "236.50", "2128.50", SettlementStatus.PENDING, null);
        ensureSettlement(BeneficiaryType.PLUMBER, plumber2.getId(), "1300.00", "130.00", "1170.00", SettlementStatus.PAID, LocalDateTime.now().minusDays(2));
        ensureSettlement(BeneficiaryType.DELIVERY_PARTNER, delivery1.getId(), "1240.00", "62.00", "1178.00", SettlementStatus.PAID, LocalDateTime.now().minusDays(1));
        ensureSettlement(BeneficiaryType.DELIVERY_PARTNER, delivery2.getId(), "980.00", "49.00", "931.00", SettlementStatus.PENDING, null);

        ensureRefund(deliveredOrder.getId(), customer1.getId(), "225.00", "Requested partial refund for damaged tap finish.", RefundStatus.PENDING, null, null);
        ensureRefund(materialOrder.getId(), customer1.getId(), "77.50", "Unused material returned after job completion.", RefundStatus.APPROVED, "Approved after stock verification.", LocalDateTime.now().minusHours(5));

        SupportTicket openTicket = ensureSupportTicket("Delay in refund confirmation", customer1, Role.CUSTOMER, deliveredOrder.getId(), null, SupportTicketCategory.REFUND, SupportTicketPriority.HIGH, SupportTicketStatus.OPEN, supportAdmin.getId(), null);
        SupportTicket inProgressTicket = ensureSupportTicket("Delivery rider could not locate address", customer2, Role.CUSTOMER, null, null, SupportTicketCategory.DELIVERY, SupportTicketPriority.MEDIUM, SupportTicketStatus.IN_PROGRESS, supportAdmin.getId(), null);
        SupportTicket escalatedTicket = ensureSupportTicket("Repeated issue after plumber visit", customer3, Role.CUSTOMER, null, activeJob.getId(), SupportTicketCategory.PLUMBER_SERVICE, SupportTicketPriority.URGENT, SupportTicketStatus.ESCALATED, supportAdmin.getId(), "Needs operations and plumber manager review.");
        ensureSupportTicket("Payment captured but order still pending", customer2, Role.CUSTOMER, null, null, SupportTicketCategory.PAYMENT, SupportTicketPriority.URGENT, SupportTicketStatus.RESOLVED, supportAdmin.getId(), null);
        ensureSupportTicket("Store pickup timing clarified", customer1, Role.CUSTOMER, null, deliveredService.getId(), SupportTicketCategory.PRODUCT_ORDER, SupportTicketPriority.LOW, SupportTicketStatus.CLOSED, supportAdmin.getId(), null);

        ensureSupportMessage(openTicket, customer1.getId(), Role.CUSTOMER, "Please confirm when the refund will reflect in my wallet.", false);
        ensureSupportMessage(openTicket, supportAdmin.getId(), Role.SUPPORT_ADMIN, "Finance team has been notified and will update this ticket shortly.", true);
        ensureSupportMessage(inProgressTicket, supportAdmin.getId(), Role.SUPPORT_ADMIN, "Delivery partner has been contacted for address confirmation.", false);
        ensureSupportMessage(escalatedTicket, supportAdmin.getId(), Role.SUPPORT_ADMIN, "Escalated because the issue reoccurred after the first service visit.", true);

        ensureOffer("WELCOME150", "New Customer Savings", "Flat discount for first-time plumbing purchases.", DiscountType.FLAT_AMOUNT, "150.00", "499.00", "150.00", 200, 18, Role.CUSTOMER, true, LocalDateTime.now().minusDays(7), LocalDateTime.now().plusDays(20));
        ensureOffer("SERVICE10", "Service Job Parts Discount", "Percentage discount on plumber-requested materials.", DiscountType.PERCENTAGE, "10.00", "299.00", "250.00", 100, 9, Role.PLUMBER, true, LocalDateTime.now().minusDays(2), LocalDateTime.now().plusDays(15));
        ensureOffer("MONSOON25", "Monsoon Week Offer", "Upcoming store-side monsoon maintenance promotion.", DiscountType.PERCENTAGE, "25.00", "799.00", "400.00", 75, 0, Role.CUSTOMER, true, LocalDateTime.now().plusDays(5), LocalDateTime.now().plusDays(25));
        ensureOffer("SPRINGENDED", "Spring Closeout", "Expired banner-linked offer kept for admin history.", DiscountType.FLAT_AMOUNT, "120.00", "599.00", "120.00", 60, 12, Role.CUSTOMER, false, LocalDateTime.now().minusDays(30), LocalDateTime.now().minusDays(2));

        ensureCampaign("June Customer Re-Engagement", "Demo campaign for re-engaging repeat customers with app notifications.", CampaignType.PUSH, "CUSTOMERS", CampaignStatus.ACTIVE, LocalDateTime.now().minusDays(3), LocalDateTime.now().plusDays(10));
        ensureCampaign("Store Manager SOP Update", "Demo internal awareness campaign for store managers.", CampaignType.EMAIL, "STORE_MANAGERS", CampaignStatus.PAUSED, LocalDateTime.now().minusDays(5), LocalDateTime.now().plusDays(5));
        ensureCampaign("Plumber Monsoon Checklist", "Draft campaign for monsoon readiness content.", CampaignType.SMS, "PLUMBERS", CampaignStatus.DRAFT, LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(20));
        ensureCampaign("Referral Booster Week", "Completed demo referral campaign retained for reporting.", CampaignType.REFERRAL, "CUSTOMERS", CampaignStatus.COMPLETED, LocalDateTime.now().minusDays(20), LocalDateTime.now().minusDays(8));

        ensureBanner("Customer Home Monsoon Safety", "Demo customer home banner for seasonal maintenance tips.", "https://images.example.com/banner-monsoon.png", "/offers/WELCOME150", BannerPlacement.CUSTOMER_HOME, true, LocalDateTime.now().minusDays(4), LocalDateTime.now().plusDays(18));
        ensureBanner("Checkout Combo Reminder", "Demo checkout banner for fittings add-ons.", "https://images.example.com/banner-checkout.png", "/marketing/offers", BannerPlacement.CHECKOUT, false, LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(1));
        ensureBanner("Store Home SLA Notice", "Demo store banner for pickup SLA reminders.", "https://images.example.com/banner-store.png", "/operations/orders", BannerPlacement.STORE_HOME, true, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        ensureNotification("Weekend Service Slots Open", "Demo notification record for weekend plumbing service slots.", "CUSTOMERS", marketingAdmin.getId(), LocalDateTime.now().minusHours(8));
        ensureNotification("Store Pickup SLA Reminder", "Demo notification record for store-side pickup readiness.", "STORE_MANAGERS", marketingAdmin.getId(), LocalDateTime.now().minusHours(3));
        ensureNotification("Monsoon Safety Checklist", "Demo notification record for plumber seasonal prep.", "PLUMBERS", marketingAdmin.getId(), LocalDateTime.now().minusMinutes(45));

        log.info("Admin demo data ready: customers={}, plumbers={}, productOrders={}, serviceOrders={}, tickets={}",
                userRepository.countByRole(Role.CUSTOMER),
                userRepository.countByRole(Role.PLUMBER),
                productOrderRepository.count(),
                serviceOrderRepository.count(),
                supportTicketRepository.count());
    }

    private User ensureUser(String email, String fullName, String phone, Role role) {
        return userRepository.findByEmail(email)
                .map(existing -> {
                    if (existing.getStatus() != UserStatus.ACTIVE) {
                        existing.setStatus(UserStatus.ACTIVE);
                        return userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .fullName(fullName)
                        .phone(phone)
                        .password(passwordEncoder.encode("password"))
                        .role(role)
                        .status(UserStatus.ACTIVE)
                        .build()));
    }

    private Store ensureStore(String name, String address, double latitude, double longitude, User manager) {
        return storeRepository.findAll().stream()
                .filter(store -> name.equalsIgnoreCase(store.getName()))
                .findFirst()
                .orElseGet(() -> storeRepository.save(Store.builder()
                        .name(name)
                        .address(address)
                        .latitude(latitude)
                        .longitude(longitude)
                        .manager(manager)
                        .build()));
    }

    private void ensureWallet(User user, String balance) {
        walletRepository.findByUserId(user.getId())
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .user(user)
                        .balance(new BigDecimal(balance))
                        .build()));
    }

    private void ensurePlumberKyc(User plumber, PlumberKycStatus status, PlumberAvailabilityStatus availabilityStatus, String serviceAreas, int experienceYears, String rejectionReason) {
        PlumberKyc kyc = plumberKycRepository.findByPlumberId(plumber.getId())
                .orElseGet(() -> PlumberKyc.builder()
                        .plumberId(plumber.getId())
                        .aadhaarNumberMasked("XXXX-XXXX-" + String.format("%04d", plumber.getId()))
                        .panNumberMasked("ABCDE" + String.format("%04d", plumber.getId()) + "F")
                        .bankAccountMasked("XXXXXX" + String.format("%04d", plumber.getId()))
                        .build());
        kyc.setExperienceYears(experienceYears);
        kyc.setServiceAreas(serviceAreas);
        kyc.setDocumentStatus(status == PlumberKycStatus.APPROVED ? "VERIFIED" : status == PlumberKycStatus.PENDING ? "UNDER_REVIEW" : "REQUIRES_RESUBMISSION");
        kyc.setStatus(status);
        kyc.setAvailabilityStatus(availabilityStatus);
        kyc.setAvailabilityReason(status == PlumberKycStatus.REJECTED ? "KYC hold" : null);
        kyc.setSubmittedAt(kyc.getSubmittedAt() == null ? LocalDateTime.now().minusDays(3) : kyc.getSubmittedAt());
        kyc.setReviewedAt(status == PlumberKycStatus.PENDING ? null : LocalDateTime.now().minusDays(1));
        kyc.setReviewedByAdminId(status == PlumberKycStatus.PENDING ? null : 1L);
        kyc.setRejectionReason(rejectionReason);
        plumberKycRepository.save(kyc);
    }

    private ServiceOrder ensureServiceOrder(
            String key,
            User customer,
            User plumber,
            Store store,
            OrderStatus status,
            RequestType requestType,
            String description,
            String laborCharge,
            String partsCharge,
            String platformFee,
            String totalAmount
    ) {
        return serviceOrderRepository.findAll().stream()
                .filter(order -> description.equals(order.getDescription()))
                .findFirst()
                .map(existing -> updateServiceOrder(existing, customer, plumber, store, status, requestType, description, laborCharge, partsCharge, platformFee, totalAmount))
                .orElseGet(() -> updateServiceOrder(ServiceOrder.builder().description(description).build(), customer, plumber, store, status, requestType, description, laborCharge, partsCharge, platformFee, totalAmount));
    }

    private ServiceOrder updateServiceOrder(
            ServiceOrder order,
            User customer,
            User plumber,
            Store store,
            OrderStatus status,
            RequestType requestType,
            String description,
            String laborCharge,
            String partsCharge,
            String platformFee,
            String totalAmount
    ) {
        LocalDateTime now = LocalDateTime.now();
        order.setCustomer(customer);
        order.setPlumber(plumber);
        order.setStore(store);
        order.setStatus(status);
        order.setRequestType(requestType);
        order.setDescription(description);
        order.setCustomerLatitude(19.0720);
        order.setCustomerLongitude(72.8820);
        order.setLaborCharge(new BigDecimal(laborCharge));
        order.setPartsCharge(new BigDecimal(partsCharge));
        order.setPlatformFee(new BigDecimal(platformFee));
        order.setTotalAmount(new BigDecimal(totalAmount));
        order.setReferralCommission(new BigDecimal(partsCharge).multiply(new BigDecimal("0.10")));
        order.setAcceptedAt(status == OrderStatus.PENDING ? null : now.minusHours(6));
        order.setStartedAt(status == OrderStatus.IN_PROGRESS || status == OrderStatus.COMBINED_ORDER || status == OrderStatus.COMPLETED || status == OrderStatus.PAID ? now.minusHours(4) : null);
        order.setCompletedAt(status == OrderStatus.COMPLETED || status == OrderStatus.PAID ? now.minusHours(1) : null);
        return serviceOrderRepository.save(order);
    }

    private ProductOrder ensureProductOrder(
            String key,
            User customer,
            Store store,
            ProductOrderStatus status,
            User deliveryPartner,
            ServiceOrder serviceOrder,
            LocalDateTime estimatedDeliveryAt,
            List<ProductOrderItemSeed> itemSeeds
    ) {
        return productOrderRepository.findAll().stream()
                .filter(order -> key.equals(order.getDeliveryOtp()))
                .findFirst()
                .map(existing -> updateProductOrder(existing, key, customer, store, status, deliveryPartner, serviceOrder, estimatedDeliveryAt, itemSeeds))
                .orElseGet(() -> updateProductOrder(ProductOrder.builder().deliveryOtp(key).build(), key, customer, store, status, deliveryPartner, serviceOrder, estimatedDeliveryAt, itemSeeds));
    }

    private ProductOrder updateProductOrder(
            ProductOrder order,
            String key,
            User customer,
            Store store,
            ProductOrderStatus status,
            User deliveryPartner,
            ServiceOrder serviceOrder,
            LocalDateTime estimatedDeliveryAt,
            List<ProductOrderItemSeed> itemSeeds
    ) {
        BigDecimal total = itemSeeds.stream()
                .map(seed -> seed.price().multiply(BigDecimal.valueOf(seed.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setCustomer(customer);
        order.setStore(store);
        order.setStatus(status);
        order.setDeliveryPartner(deliveryPartner);
        order.setServiceOrder(serviceOrder);
        order.setDeliveryOtp(key);
        order.setEstimatedDeliveryAt(estimatedDeliveryAt);
        order.setTotalAmount(total);
        if (order.getItems() == null) {
            order.setItems(new java.util.ArrayList<>());
        }
        order.getItems().clear();
        for (ProductOrderItemSeed seed : itemSeeds) {
            order.getItems().add(ProductOrderItem.builder()
                    .order(order)
                    .product(seed.product())
                    .quantity(seed.quantity())
                    .price(seed.price())
                    .build());
        }
        return productOrderRepository.save(order);
    }

    private void ensureSettlement(BeneficiaryType type, Long beneficiaryId, String gross, String commission, String net, SettlementStatus status, LocalDateTime paidAt) {
        boolean exists = settlementRepository.findByBeneficiaryType(type).stream()
                .anyMatch(settlement -> settlement.getBeneficiaryId().equals(beneficiaryId)
                        && settlement.getGrossAmount().compareTo(new BigDecimal(gross)) == 0);
        if (!exists) {
            settlementRepository.save(Settlement.builder()
                    .beneficiaryType(type)
                    .beneficiaryId(beneficiaryId)
                    .grossAmount(new BigDecimal(gross))
                    .commissionAmount(new BigDecimal(commission))
                    .netAmount(new BigDecimal(net))
                    .status(status)
                    .paidAt(paidAt)
                    .build());
        }
    }

    private void ensureRefund(Long orderId, Long customerId, String amount, String reason, RefundStatus status, String financeNote, LocalDateTime processedAt) {
        boolean exists = refundRequestRepository.findAll().stream()
                .anyMatch(refund -> refund.getOrderId().equals(orderId) && reason.equals(refund.getReason()));
        if (!exists) {
            refundRequestRepository.save(RefundRequest.builder()
                    .orderId(orderId)
                    .customerId(customerId)
                    .amount(new BigDecimal(amount))
                    .reason(reason)
                    .status(status)
                    .financeNote(financeNote)
                    .processedAt(processedAt)
                    .build());
        }
    }

    private SupportTicket ensureSupportTicket(
            String subject,
            User requester,
            Role requesterRole,
            Long productOrderId,
            Long serviceOrderId,
            SupportTicketCategory category,
            SupportTicketPriority priority,
            SupportTicketStatus status,
            Long assignedAdminId,
            String escalationReason
    ) {
        return supportTicketRepository.findAll().stream()
                .filter(ticket -> subject.equals(ticket.getSubject()))
                .findFirst()
                .map(existing -> updateSupportTicket(existing, requester, requesterRole, productOrderId, serviceOrderId, category, priority, status, assignedAdminId, escalationReason))
                .orElseGet(() -> updateSupportTicket(SupportTicket.builder()
                        .ticketNumber(nextTicketNumber())
                        .subject(subject)
                        .description(subject)
                        .build(), requester, requesterRole, productOrderId, serviceOrderId, category, priority, status, assignedAdminId, escalationReason));
    }

    private SupportTicket updateSupportTicket(
            SupportTicket ticket,
            User requester,
            Role requesterRole,
            Long productOrderId,
            Long serviceOrderId,
            SupportTicketCategory category,
            SupportTicketPriority priority,
            SupportTicketStatus status,
            Long assignedAdminId,
            String escalationReason
    ) {
        ticket.setRequesterId(requester.getId());
        ticket.setRequesterRole(requesterRole);
        ticket.setRelatedProductOrderId(productOrderId);
        ticket.setRelatedServiceOrderId(serviceOrderId);
        ticket.setCategory(category);
        ticket.setPriority(priority);
        ticket.setStatus(status);
        ticket.setDescription(ticket.getSubject() + " - demo support record for admin review.");
        ticket.setAssignedAdminId(assignedAdminId);
        ticket.setEscalationReason(escalationReason);
        ticket.setResolvedAt(status == SupportTicketStatus.RESOLVED || status == SupportTicketStatus.CLOSED ? LocalDateTime.now().minusHours(2) : null);
        return supportTicketRepository.save(ticket);
    }

    private void ensureSupportMessage(SupportTicket ticket, Long senderId, Role senderRole, String message, boolean internalNote) {
        boolean exists = supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .anyMatch(saved -> message.equals(saved.getMessage()));
        if (!exists) {
            supportMessageRepository.save(SupportMessage.builder()
                    .ticketId(ticket.getId())
                    .senderId(senderId)
                    .senderRole(senderRole)
                    .message(message)
                    .internalNote(internalNote)
                    .build());
        }
    }

    private void ensureOffer(
            String code,
            String title,
            String description,
            DiscountType discountType,
            String discountValue,
            String minOrderAmount,
            String maxDiscountAmount,
            Integer usageLimit,
            int usedCount,
            Role targetRole,
            boolean active,
            LocalDateTime startsAt,
            LocalDateTime endsAt
    ) {
        Offer offer = offerRepository.findAll().stream()
                .filter(existing -> code.equalsIgnoreCase(existing.getCode()))
                .findFirst()
                .orElseGet(() -> Offer.builder().code(code).build());
        offer.setTitle(title);
        offer.setDescription(description);
        offer.setDiscountType(discountType);
        offer.setDiscountValue(new BigDecimal(discountValue));
        offer.setMinOrderAmount(new BigDecimal(minOrderAmount));
        offer.setMaxDiscountAmount(new BigDecimal(maxDiscountAmount));
        offer.setUsageLimit(usageLimit);
        offer.setUsedCount(usedCount);
        offer.setTargetRole(targetRole);
        offer.setActive(active);
        offer.setStartsAt(startsAt);
        offer.setEndsAt(endsAt);
        offerRepository.save(offer);
    }

    private void ensureCampaign(String name, String description, CampaignType type, String targetSegment, CampaignStatus status, LocalDateTime startsAt, LocalDateTime endsAt) {
        MarketingCampaign campaign = marketingCampaignRepository.findAll().stream()
                .filter(existing -> name.equalsIgnoreCase(existing.getName()))
                .findFirst()
                .orElseGet(() -> MarketingCampaign.builder().name(name).build());
        campaign.setDescription(description);
        campaign.setCampaignType(type);
        campaign.setTargetSegment(targetSegment);
        campaign.setStatus(status);
        campaign.setStartsAt(startsAt);
        campaign.setEndsAt(endsAt);
        marketingCampaignRepository.save(campaign);
    }

    private void ensureBanner(String title, String subtitle, String imageUrl, String deeplink, BannerPlacement placement, boolean active, LocalDateTime startsAt, LocalDateTime endsAt) {
        MarketingBanner banner = marketingBannerRepository.findAll().stream()
                .filter(existing -> title.equalsIgnoreCase(existing.getTitle()))
                .findFirst()
                .orElseGet(() -> MarketingBanner.builder().title(title).build());
        banner.setSubtitle(subtitle);
        banner.setImageUrl(imageUrl);
        banner.setDeeplink(deeplink);
        banner.setPlacement(placement);
        banner.setActive(active);
        banner.setStartsAt(startsAt);
        banner.setEndsAt(endsAt);
        marketingBannerRepository.save(banner);
    }

    private void ensureNotification(String title, String message, String targetSegment, Long sentByAdminId, LocalDateTime sentAt) {
        boolean exists = marketingNotificationRepository.findAll().stream()
                .anyMatch(notification -> title.equalsIgnoreCase(notification.getTitle()) && targetSegment.equalsIgnoreCase(notification.getTargetSegment()));
        if (!exists) {
            marketingNotificationRepository.save(MarketingNotification.builder()
                    .title(title)
                    .message(message)
                    .targetSegment(targetSegment)
                    .sentByAdminId(sentByAdminId)
                    .status(MarketingNotificationStatus.SENT)
                    .sentAt(sentAt)
                    .build());
        }
    }

    private String nextTicketNumber() {
        long next = supportTicketRepository.findTopByOrderByIdDesc().map(ticket -> ticket.getId() + 1).orElse(1L);
        return String.format("SUP-%06d", next);
    }

    private ProductOrderItemSeed item(Product product, int quantity, String price) {
        return new ProductOrderItemSeed(product, quantity, new BigDecimal(price));
    }

    private record ProductOrderItemSeed(Product product, int quantity, BigDecimal price) {
    }
}





