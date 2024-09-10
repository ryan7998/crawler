<template>
    <div>
      <!-- Sleek Navbar -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="#">Crawler Dashboard</a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link text-muted" href="#">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-muted" href="#">Settings</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
  
      <!-- Main Content -->
      <div class="container">
        <div class="row">
          <!-- Sidebar Actions -->
          <div class="col-md-3">
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h6 class="card-title text-muted">Actions</h6>
                <button class="btn btn-outline-warning btn-block mb-2" @click="pauseCrawl">Pause Crawl</button>
                <button class="btn btn-outline-success btn-block mb-2" @click="resumeCrawl">Resume Crawl</button>
                <button class="btn btn-outline-danger btn-block" @click="restartCrawl">Restart Crawl</button>
              </div>
            </div>
          </div>
  
          <!-- Crawl Summary Section -->
          <div class="col-md-9">
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="card border-0 shadow-sm text-center bg-light">
                  <div class="card-body">
                    <h6 class="text-muted">In Progress</h6>
                    <h2 class="fw-bold text-info">{{ inProgressCount }}</h2>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm text-center bg-light">
                  <div class="card-body">
                    <h6 class="text-muted">Completed</h6>
                    <h2 class="fw-bold text-success">{{ completedCount }}</h2>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm text-center bg-light">
                  <div class="card-body">
                    <h6 class="text-muted">Failed</h6>
                    <h2 class="fw-bold text-danger">{{ failedCount }}</h2>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Crawl Details Section -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h6 class="text-muted mb-4">Crawl Details</h6>
                <table class="table table-borderless">
                  <thead class="bg-light">
                    <tr>
                      <th>URL</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(url, index) in crawl.urls" :key="index">
                      <td>{{ url.url }}</td>
                      <td>
                        <span
                          :class="[
                            'badge',
                            url.status === 'completed' ? 'bg-success' : url.status === 'failed' ? 'bg-danger' : 'bg-info'
                          ]"
                          >{{ url.status }}</span
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
  
                <!-- Results Section -->
                <h6 class="mt-4 text-muted">Results</h6>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item" v-for="(result, index) in crawl.result" :key="index">
                    {{ result }}
                  </li>
                </ul>
  
                <!-- Errors Section -->
                <h6 class="mt-4 text-muted">Errors</h6>
                <div v-if="crawl.errors.length">
                  <div
                    v-for="(error, index) in crawl.errors"
                    :key="index"
                    class="alert alert-danger"
                    role="alert"
                  >
                    <strong>Error:</strong> {{ error.url }} - {{ error.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  
  const route = useRoute();
  const crawlId = ref(route.params.crawlId); // Get the crawl ID from the URL
  const crawl = ref({
    urls: [],
    result: [],
    errors: [],
  });
  const inProgressCount = ref(0);
  const completedCount = ref(0);
  const failedCount = ref(0);
  
  // Fetch crawl data from backend
  onMounted(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/crawl/${crawlId.value}`);
      crawl.value = response.data;
  
      // Update counts
      inProgressCount.value = crawl.value.urls.filter((url) => url.status === 'in-progress').length;
      completedCount.value = crawl.value.urls.filter((url) => url.status === 'completed').length;
      failedCount.value = crawl.value.urls.filter((url) => url.status === 'failed').length;
    } catch (error) {
      console.error('Error fetching crawl data', error);
    }
  });
  
  // Actions (these functions would need to emit the corresponding Socket.io events)
  const pauseCrawl = () => {
    console.log('Pausing crawl');
  };
  
  const resumeCrawl = () => {
    console.log('Resuming crawl');
  };
  
  const restartCrawl = () => {
    console.log('Restarting crawl');
  };
  </script>
  
  <style scoped>
  /* Add shadow and flat UI styles */
  .card {
    border-radius: 12px;
  }
  
  .card-body {
    padding: 20px;
  }
  
  h6 {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.9rem;
  }
  
  .navbar {
    border-bottom: 1px solid #e5e5e5;
  }
  
  .btn-block {
    width: 100%;
  }
  
  .table-borderless th,
  .table-borderless td {
    border: none;
  }
  
  .shadow-sm {
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  </style>