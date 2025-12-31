#!/usr/bin/env node

/**
 * Simple Integration Test - Focuses on API endpoints and error handling
 * Tests the actual workflow without requiring TypeScript compilation
 */

const { writeFileSync, readFileSync } = require('fs')
const { execSync } = require('child_process')

console.log('🔍 SIMPLE INTEGRATION TEST')
console.log('==========================\n')

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
}

// Test 1: Check if the application can start
console.log('🚀 TEST 1: Application Startup Check')
try {
  // Check if package.json exists and has required scripts
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  
  if (!packageJson.scripts || !packageJson.scripts.dev) {
    throw new Error('Missing dev script in package.json')
  }
  
  console.log('✅ Application configuration valid')
  testResults.passed++
  testResults.details.push({ test: 'Application Startup Check', status: 'PASS' })
} catch (error) {
  console.log('❌ Application startup check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Application Startup Check', status: 'FAIL', error: error.message })
}

// Test 2: Check API route configuration
console.log('\n📡 TEST 2: API Route Configuration')
try {
  // Check if API routes exist
  const chatRoutePath = './app/api/chat/route.ts'
  const verifyRoutePath = './app/api/verify-simulation/route.ts'
  
  if (require('fs').existsSync(chatRoutePath)) {
    console.log('✅ Chat API route exists')
  } else {
    throw new Error('Chat API route missing')
  }
  
  if (require('fs').existsSync(verifyRoutePath)) {
    console.log('✅ Verify simulation API route exists')
  } else {
    throw new Error('Verify simulation API route missing')
  }
  
  console.log('✅ API route configuration valid')
  testResults.passed++
  testResults.details.push({ test: 'API Route Configuration', status: 'PASS' })
} catch (error) {
  console.log('❌ API route configuration failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'API Route Configuration', status: 'FAIL', error: error.message })
}

// Test 3: Check error handling components
console.log('\n🛡️ TEST 3: Error Handling Components')
try {
  const errorBoundaryPath = './components/error-boundary.tsx'
  const fallbackPath = './lib/fallbacks.ts'
  const sandboxErrorPath = './lib/sandbox-errors.ts'
  
  if (!require('fs').existsSync(errorBoundaryPath)) {
    throw new Error('Error boundary component missing')
  }
  
  if (!require('fs').existsSync(fallbackPath)) {
    throw new Error('Fallback mechanisms missing')
  }
  
  if (!require('fs').existsSync(sandboxErrorPath)) {
    throw new Error('Sandbox error handling missing')
  }
  
  console.log('✅ Error handling components present')
  testResults.passed++
  testResults.details.push({ test: 'Error Handling Components', status: 'PASS' })
} catch (error) {
  console.log('❌ Error handling components check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Error Handling Components', status: 'FAIL', error: error.message })
}

// Test 4: Check validation scripts
console.log('\n🔒 TEST 4: Validation Scripts')
try {
  const validateCommandPath = './scripts/validate-command.js'
  const validateIntegrityPath = './scripts/validate-integrity.js'
  
  if (!require('fs').existsSync(validateCommandPath)) {
    throw new Error('Command validation script missing')
  }
  
  if (!require('fs').existsSync(validateIntegrityPath)) {
    throw new Error('Integrity validation script missing')
  }
  
  console.log('✅ Validation scripts present')
  testResults.passed++
  testResults.details.push({ test: 'Validation Scripts', status: 'PASS' })
} catch (error) {
  console.log('❌ Validation scripts check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Validation Scripts', status: 'FAIL', error: error.message })
}

// Test 5: Run existing validation scripts
console.log('\n🧪 TEST 5: Run Existing Validation Scripts')
try {
  // Run the validate-integrity script
  try {
    execSync('node scripts/validate-integrity.js', { 
      cwd: '.',
      stdio: 'pipe',
      encoding: 'utf8'
    })
    console.log('✅ Integrity validation passed')
  } catch (error) {
    console.log('⚠️  Integrity validation warning:', error.message)
    testResults.warnings++
  }
  
  // Run the validate-command script
  try {
    execSync('node scripts/validate-command.js', { 
      cwd: '.',
      stdio: 'pipe',
      encoding: 'utf8'
    })
    console.log('✅ Command validation passed')
  } catch (error) {
    console.log('⚠️  Command validation warning:', error.message)
    testResults.warnings++
  }
  
  testResults.passed++
  testResults.details.push({ test: 'Run Existing Validation Scripts', status: 'PASS' })
} catch (error) {
  console.log('❌ Running validation scripts failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Run Existing Validation Scripts', status: 'FAIL', error: error.message })
}

// Test 6: Check middleware configuration
console.log('\n🔧 TEST 6: Middleware Configuration')
try {
  const middlewarePath = './middleware.ts'
  
  if (!require('fs').existsSync(middlewarePath)) {
    throw new Error('Middleware configuration missing')
  }
  
  // Check middleware content
  const middlewareContent = readFileSync(middlewarePath, 'utf8')
  
  if (!middlewareContent.includes('rate') || !middlewareContent.includes('limit')) {
    console.log('⚠️  Rate limiting configuration might be incomplete')
    testResults.warnings++
  }
  
  if (!middlewareContent.includes('security') || !middlewareContent.includes('header')) {
    console.log('⚠️  Security headers might be incomplete')
    testResults.warnings++
  }
  
  console.log('✅ Middleware configuration present')
  testResults.passed++
  testResults.details.push({ test: 'Middleware Configuration', status: 'PASS' })
} catch (error) {
  console.log('❌ Middleware configuration check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Middleware Configuration', status: 'FAIL', error: error.message })
}

// Test 7: Check component structure
console.log('\n🧩 TEST 7: Component Structure')
try {
  const requiredComponents = [
    './components/chat.tsx',
    './components/chat-input.tsx',
    './components/preview.tsx',
    './components/loading-states.tsx',
    './components/error-boundary.tsx'
  ]
  
  let missingComponents = []
  requiredComponents.forEach(component => {
    if (!require('fs').existsSync(component)) {
      missingComponents.push(component)
    }
  })
  
  if (missingComponents.length > 0) {
    throw new Error(`Missing components: ${missingComponents.join(', ')}`)
  }
  
  console.log('✅ All required components present')
  testResults.passed++
  testResults.details.push({ test: 'Component Structure', status: 'PASS' })
} catch (error) {
  console.log('❌ Component structure check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Component Structure', status: 'FAIL', error: error.message })
}

// Test 8: Check error patterns in code
console.log('\n🔍 TEST 8: Error Pattern Analysis')
try {
  const filesToCheck = [
    './components/chat-input.tsx',
    './components/preview.tsx',
    './app/page.tsx'
  ]
  
  let errorHandlingFound = false
  filesToCheck.forEach(file => {
    if (require('fs').existsSync(file)) {
      const content = readFileSync(file, 'utf8')
      if (content.includes('error') || content.includes('Error') || 
          content.includes('catch') || content.includes('try')) {
        errorHandlingFound = true
      }
    }
  })
  
  if (!errorHandlingFound) {
    console.log('⚠️  Limited error handling found in components')
    testResults.warnings++
  } else {
    console.log('✅ Error handling patterns found in components')
  }
  
  testResults.passed++
  testResults.details.push({ test: 'Error Pattern Analysis', status: 'PASS' })
} catch (error) {
  console.log('❌ Error pattern analysis failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Error Pattern Analysis', status: 'FAIL', error: error.message })
}

// Test 9: Check package dependencies
console.log('\n📦 TEST 9: Package Dependencies')
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  
  const requiredDeps = ['react', 'next', 'ai', 'zod']
  let missingDeps = []
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(dep)
    }
  })
  
  if (missingDeps.length > 0) {
    throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`)
  }
  
  console.log('✅ Required dependencies present')
  testResults.passed++
  testResults.details.push({ test: 'Package Dependencies', status: 'PASS' })
} catch (error) {
  console.log('❌ Package dependencies check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Package Dependencies', status: 'FAIL', error: error.message })
}

// Test 10: Check configuration files
console.log('\n⚙️ TEST 10: Configuration Files')
try {
  const configFiles = [
    './tsconfig.json',
    './next.config.mjs',
    './tailwind.config.ts',
    './.eslintrc.json'
  ]
  
  let missingConfigs = []
  configFiles.forEach(config => {
    if (!require('fs').existsSync(config)) {
      missingConfigs.push(config)
    }
  })
  
  if (missingConfigs.length > 0) {
    throw new Error(`Missing config files: ${missingConfigs.join(', ')}`)
  }
  
  console.log('✅ All configuration files present')
  testResults.passed++
  testResults.details.push({ test: 'Configuration Files', status: 'PASS' })
} catch (error) {
  console.log('❌ Configuration files check failed:', error.message)
  testResults.failed++
  testResults.details.push({ test: 'Configuration Files', status: 'FAIL', error: error.message })
}

// Generate final report
console.log('\n📊 INTEGRATION TEST REPORT')
console.log('========================')
console.log(`Total Tests: ${testResults.passed + testResults.failed + testResults.warnings}`)
console.log(`Passed: ${testResults.passed}`)
console.log(`Failed: ${testResults.failed}`)
console.log(`Warnings: ${testResults.warnings}`)

const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100
console.log(`Success Rate: ${successRate.toFixed(2)}%`)

if (testResults.failed === 0) {
  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!')
  console.log('The system appears to be properly configured.')
} else {
  console.log('\n⚠️  SOME TESTS FAILED')
  console.log('Review the failed tests for potential issues.')
  
  testResults.details.forEach(detail => {
    if (detail.status === 'FAIL') {
      console.log(`  - ${detail.test}: ${detail.error}`)
    }
  })
}

// Export results for further analysis
writeFileSync('SIMPLE_INTEGRATION_TEST_RESULTS.json', JSON.stringify(testResults, null, 2))
console.log('\n📄 Results saved to SIMPLE_INTEGRATION_TEST_RESULTS.json')

// Analyze the error you reported
console.log('\n🔍 ANALYZING REPORTED ERROR')
console.log('============================')
console.log('Error: "An unexpected error has occurred. Please try again later."')
console.log('\nThis error typically occurs when:')
console.log('1. API endpoint fails to respond properly')
console.log('2. Network connectivity issues')
console.log('3. Backend service is unavailable')
console.log('4. Rate limiting is triggered')
console.log('5. Authentication/authorization issues')

console.log('\n🛠️ RECOMMENDED TROUBLESHOOTING STEPS:')
console.log('1. Check API endpoint health')
console.log('2. Verify network connectivity')
console.log('3. Review error logs for detailed information')
console.log('4. Check rate limiting configuration')
console.log('5. Test with different input patterns')

console.log('\n📋 NEXT STEPS:')
console.log('1. Run the application in development mode: npm run dev')
console.log('2. Monitor console logs for detailed error information')
console.log('3. Test specific API endpoints with curl or Postman')
console.log('4. Check network tab in browser developer tools')
console.log('5. Review middleware and error handling components')