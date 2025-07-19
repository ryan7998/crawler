import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { getSocketUrl } from '../utils/commonUtils'

/**
 * Reusable socket connection composable
 * Handles socket connection, events, and cleanup
 */
export function useSocketConnection(options = {}) {
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionError = ref(null)
  const logs = ref([])

  const {
    socketUrl = getSocketUrl(),
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    path = '/socket.io/',
    transports = ['websocket', 'polling']
  } = options

  /**
   * Initialize socket connection
   */
  const connect = () => {
    try {
      console.log('Connecting to socket at:', socketUrl)
      
      socket.value = io(socketUrl, {
        path,
        transports,
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay
      })

      setupEventListeners()
      
      if (autoConnect) {
        socket.value.connect()
      }
    } catch (error) {
      console.error('Socket initialization error:', error)
      connectionError.value = error.message
    }
  }

  /**
   * Setup socket event listeners
   */
  const setupEventListeners = () => {
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log('Connected to Socket.io server')
      isConnected.value = true
      connectionError.value = null
    })

    socket.value.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason)
      isConnected.value = false
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      connectionError.value = error.message
      isConnected.value = false
    })

    socket.value.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to Socket.io server after', attemptNumber, 'attempts')
      isConnected.value = true
      connectionError.value = null
    })

    socket.value.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error)
      connectionError.value = error.message
    })
  }

  /**
   * Join a specific room
   * @param {string} roomId - Room identifier
   */
  const joinRoom = (roomId) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('joinCrawl', roomId)
    }
  }

  /**
   * Leave a specific room
   * @param {string} roomId - Room identifier
   */
  const leaveRoom = (roomId) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('leaveCrawl', roomId)
    }
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  const emit = (event, data) => {
    if (socket.value && isConnected.value) {
      socket.value.emit(event, data)
    }
  }

  /**
   * Listen to an event from the server
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler (optional)
   */
  const off = (event, callback) => {
    if (socket.value) {
      if (callback) {
        socket.value.off(event, callback)
      } else {
        socket.value.off(event)
      }
    }
  }

  /**
   * Disconnect socket
   */
  const disconnect = () => {
    if (socket.value) {
      console.log('Disconnecting socket...')
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  /**
   * Cleanup function
   */
  const cleanup = () => {
    disconnect()
    logs.value = []
    connectionError.value = null
  }

  // Auto-connect on mount if enabled
  onMounted(() => {
    if (autoConnect) {
      connect()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    socket: socket.value,
    isConnected,
    connectionError,
    logs,
    
    // Methods
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
    cleanup
  }
} 