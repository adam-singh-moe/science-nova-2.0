#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url || !serviceKey){
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}
const client = createClient(url, serviceKey)

async function ensureTopic(){
  const { data, error } = await client.from('topics').select('id,title').limit(1)
  if(error){
    console.error('Error selecting topics:', error.message)
    return null
  }
  if(data && data.length){
    return data[0]
  }
  const title = 'Integration Test Topic ' + Date.now()
  const { data: inserted, error: insErr } = await client.from('topics').insert({ title, grade_level: 5 }).select('id,title').single()
  if(insErr){
    console.error('Failed to create test topic:', insErr.message)
    return null
  }
  return inserted
}

async function getProfile(){
  const { data, error } = await client.from('profiles').select('id,role').in('role',['TEACHER','ADMIN','DEVELOPER']).limit(1)
  if(error){
    console.error('Error selecting profiles:', error.message)
    return null
  }
  if(data && data.length) return data[0]
  console.error('No suitable profile (TEACHER/ADMIN/DEVELOPER) found. Create one manually and re-run.')
  return null
}

const topic = await ensureTopic()
const profile = await getProfile()

console.log('\nSuggested env additions for integration tests:')
if(topic) console.log('TEST_TOPIC_ID=' + topic.id)
if(profile) console.log('TEST_USER_ID=' + profile.id)
if(!topic || !profile){
  console.log('\nIncomplete: please address warnings above.')
  process.exit(2)
}
console.log('\nAdd the above to your .env.local (DO NOT COMMIT service keys).')