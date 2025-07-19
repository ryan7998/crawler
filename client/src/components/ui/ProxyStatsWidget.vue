<template>
  <div class="proxy-stats-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <v-icon icon="mdi-server-network" class="mr-2" />
        Proxy Usage
      </h3>
      <v-btn
        v-if="showRefresh"
        icon="mdi-refresh"
        size="small"
        variant="text"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>

    <div v-if="loading" class="widget-loading">
      <v-progress-circular indeterminate size="24" />
      <span class="ml-2">Loading proxy stats...</span>
    </div>

    <div v-else-if="error" class="widget-error">
      <v-icon icon="mdi-alert-circle" color="error" class="mr-2" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="stats && stats.totalRequests !== undefined" class="widget-content">
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(stats.totalRequests) }}</div>
          <div class="stat-label">Total Requests</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(stats.uniqueProxies) }}</div>
          <div class="stat-label">Unique Proxies</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ formatCost(stats.totalCost) }}</div>
          <div class="stat-label">Total Cost</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ formatPercentage(stats.successRate) }}</div>
          <div class="stat-label">Success Rate</div>
        </div>
      </div>

      <!-- Last Used Info -->
      <div v-if="stats.lastUsed" class="last-used">
        <v-icon icon="mdi-clock-outline" size="small" class="mr-1" />
        <span>Last used: {{ getRelativeTime(stats.lastUsed) }}</span>
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-icon
              v-bind="props"
              icon="mdi-information-outline"
              size="small"
              class="ml-1"
            />
          </template>
          <span>{{ formatDate(stats.lastUsed) }}</span>
        </v-tooltip>
      </div>

      <!-- Performance Chart (if detailed data available) -->
      <div v-if="detailedStats && detailedStats.proxyPerformance?.length > 0" class="performance-section">
        <h4 class="section-title">Proxy Performance</h4>
        <div class="performance-list">
          <div
            v-for="proxy in detailedStats.proxyPerformance.slice(0, 5)"
            :key="proxy.proxyId"
            class="performance-item"
          >
            <div class="proxy-info">
              <div class="proxy-id">{{ proxy.proxyId || 'Unknown Proxy' }}</div>
              <div class="proxy-location">{{ proxy.location || 'Unknown Location' }}</div>
            </div>
            <div class="proxy-stats">
              <div class="stat">
                <span class="stat-label">Requests:</span>
                <span class="stat-value">{{ formatNumber(proxy.totalRequests) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Success:</span>
                <span class="stat-value">{{ formatPercentage(proxy.successRate) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Cost:</span>
                <span class="stat-value">{{ formatCost(proxy.totalCost) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-else-if="!stats || stats.totalRequests === 0" class="no-data">
        <v-icon icon="mdi-server-off" size="large" color="grey" />
        <p>No proxy usage data available</p>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="showActions && stats && stats.totalRequests > 0" class="widget-actions">
      <v-btn
        size="small"
        variant="outlined"
        @click="$emit('view-details')"
      >
        View Details
      </v-btn>
      <v-btn
        v-if="showCleanup"
        size="small"
        variant="outlined"
        color="warning"
        @click="$emit('cleanup')"
      >
        Cleanup Old Data
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: null
  },
  detailedStats: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showCleanup: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'view-details', 'cleanup'])

// Helper functions
const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

const formatCost = (cost) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4
  }).format(cost)
}

const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getRelativeTime = (date) => {
  if (!date) return 'Never'
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now - targetDate) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`
}
</script>

<style scoped>
.proxy-stats-widget {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
}

.widget-loading,
.widget-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #6b7280;
}

.widget-error {
  color: #dc2626;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.last-used {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 16px;
}

.performance-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.performance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.performance-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.proxy-info {
  flex: 1;
}

.proxy-id {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.proxy-location {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.proxy-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.no-data {
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

.no-data p {
  margin: 8px 0 0 0;
  font-size: 0.875rem;
}

.widget-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .performance-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .proxy-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat {
    align-items: flex-start;
  }
}
</style> 