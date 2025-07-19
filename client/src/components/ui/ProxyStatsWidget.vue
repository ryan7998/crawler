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
import { useFormatting } from '@/composables/useFormatting'

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

// Use centralized formatting utilities
const {
  formatNumber,
  formatCost,
  formatPercentage,
  formatDate,
  getRelativeTime
} = useFormatting()
</script>

<style scoped>
.proxy-stats-widget {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  color: #666;
}

.widget-error {
  color: #d32f2f;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
}

.last-used {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 16px;
}

.performance-section {
  margin-top: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.performance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.proxy-info {
  flex: 1;
}

.proxy-id {
  font-weight: 500;
  font-size: 0.875rem;
}

.proxy-location {
  font-size: 0.75rem;
  color: #666;
}

.proxy-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
}

.stat-label {
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 32px 16px;
  color: #666;
}

.no-data p {
  margin-top: 8px;
  font-size: 0.875rem;
}

.widget-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .proxy-stats {
    gap: 8px;
  }
  
  .widget-actions {
    flex-direction: column;
  }
}
</style> 