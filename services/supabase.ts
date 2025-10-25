
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://ipzitalmkqqvowfafpbh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlweml0YWxta3Fxdm93ZmFmcGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTM0NjcsImV4cCI6MjA3Njg4OTQ2N30.YqeDj6fmwhY6pJ2gxbYKZfuvcux1AhdJsX6jHjaityk'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase