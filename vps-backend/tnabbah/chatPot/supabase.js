const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  }
)

module.exports = supabase

