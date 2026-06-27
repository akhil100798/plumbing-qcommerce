package com.pqc.core.dto;

import java.math.BigDecimal;
import java.util.List;

public record SupportDashboardResponse(long openTickets, long inProgressTickets, long escalatedTickets, long resolvedToday, long urgentTickets, long paymentIssues, long deliveryIssues, long serviceIssues, BigDecimal averageResolutionHours, List<SupportTicketSummary> recentTickets, List<SupportTicketSummary> urgentTicketList, List<SupportTicketSummary> escalatedTicketList) {}
