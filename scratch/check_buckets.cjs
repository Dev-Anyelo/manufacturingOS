
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBuckets() {
  console.log('Checking storage buckets...')
  const { data, error } = await supabase.storage.listBuckets()

  if (error) {
    console.error('Error listing buckets:', error)
    return
  }

  console.log('Existing buckets:', data.map(b => b.name))
  
  const requiredBuckets = ['catalog', 'inventory', 'expenses', 'payroll', 'orders']
  const missing = requiredBuckets.filter(name => !data.find(b => b.name === name))

  if (missing.length > 0) {
    console.log('MISSING BUCKETS:', missing)
    console.log('\nSuggested SQL to run in Supabase SQL Editor:')
    console.log('-------------------------------------------')
    missing.forEach(name => {
      const isPublic = ['catalog', 'inventory'].includes(name)
      console.log(`INSERT INTO storage.buckets (id, name, public) VALUES ('${name}', '${name}', ${isPublic});`)
    })
  } else {
    console.log('All required buckets are present!')
  }
}

checkBuckets()
