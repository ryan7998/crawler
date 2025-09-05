<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <!-- Hero Section -->
    <div class="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Extract Data from
          <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Any Website
          </span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Powerful web scraping tool with real-time monitoring, custom selectors, and automated data export. 
          Scale your data extraction with enterprise-grade reliability.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            @click="openAuthModal('register')"
            class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Start Free Trial
          </button>
          <button
            @click="scrollToFeatures"
            class="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            View Features
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600 mb-2">10K+</div>
            <div class="text-gray-600">Websites Scraped</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-indigo-600 mb-2">99.9%</div>
            <div class="text-gray-600">Uptime</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600 mb-2">24/7</div>
            <div class="text-gray-600">Monitoring</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div ref="featuresSection" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Scale Data Extraction
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            From simple web scraping to complex data pipelines, our platform handles it all with enterprise-grade features.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
            <p class="text-gray-600">Extract data from thousands of pages in minutes with our optimized crawling engine and parallel processing.</p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Real-time Monitoring</h3>
            <p class="text-gray-600">Track crawl progress, monitor success rates, and get instant notifications when data changes.</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Custom Selectors</h3>
            <p class="text-gray-600">Create complex CSS selectors with nested data extraction and domain-specific templates.</p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Multiple Export Formats</h3>
            <p class="text-gray-600">Export to CSV, Excel, or Google Sheets with automated scheduling and change detection.</p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl border border-teal-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
            <p class="text-gray-600">Enterprise-grade security with proxy rotation, rate limiting, and 99.9% uptime guarantee.</p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all duration-300">
            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
            <p class="text-gray-600">Comprehensive analytics dashboard with success rates, performance metrics, and data trends.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Scale Your Data Extraction?
        </h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of businesses already using CrawlerPro to extract valuable data from the web.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="openAuthModal('register')"
            class="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Start Your Free Trial
          </button>
          <button
            @click="scrollToFeatures"
            class="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
              </svg>
            </div>
            <span class="ml-3 text-2xl font-bold text-white">CrawlerPro</span>
          </div>
          <p class="text-gray-400 mb-4">
            Advanced web scraping platform for modern businesses
          </p>
          <p class="text-gray-500 text-sm">
            © 2024 CrawlerPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const featuresSection = ref(null)

// Define emits
const emit = defineEmits(['open-auth-modal'])

const openAuthModal = (mode) => {
  emit('open-auth-modal', mode)
}

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Smooth transitions for all interactive elements */
* {
  transition: all 0.2s ease-in-out;
}

/* Gradient text animation */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
</style>