/**
 * Database Seed Script
 * Populates the database with realistic demo data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (in development)
  console.log('🧹 Cleaning existing data...')
  await prisma.glossaryTerm.deleteMany()
  await prisma.localeString.deleteMany()
  await prisma.project.deleteMany()

  // Create demo projects
  console.log('📦 Creating demo projects...')

  const webAppProject = await prisma.project.create({
    data: {
      name: 'My Web App',
      slug: 'my-web-app',
      defaultLocale: 'en-US',
    },
  })

  const mobileAppProject = await prisma.project.create({
    data: {
      name: 'Mobile App',
      slug: 'mobile-app',
      defaultLocale: 'en-US',
    },
  })

  const marketingProject = await prisma.project.create({
    data: {
      name: 'Marketing Website',
      slug: 'marketing-site',
      defaultLocale: 'en-US',
    },
  })

  // Create locale strings for Web App project
  console.log('🌍 Creating locale strings...')

  const webAppStrings = [
    // English strings
    { key: 'app.welcome', locale: 'en-US', value: 'Welcome to our application!', description: 'Main welcome message' },
    { key: 'app.login', locale: 'en-US', value: 'Log In', description: 'Login button text' },
    { key: 'app.logout', locale: 'en-US', value: 'Log Out', description: 'Logout button text' },
    { key: 'app.signup', locale: 'en-US', value: 'Sign Up', description: 'Signup button text' },
    { key: 'nav.home', locale: 'en-US', value: 'Home', description: 'Navigation: Home' },
    { key: 'nav.dashboard', locale: 'en-US', value: 'Dashboard', description: 'Navigation: Dashboard' },
    { key: 'nav.settings', locale: 'en-US', value: 'Settings', description: 'Navigation: Settings' },
    { key: 'nav.profile', locale: 'en-US', value: 'Profile', description: 'Navigation: Profile' },
    { key: 'form.email', locale: 'en-US', value: 'Email', description: 'Form label: Email' },
    { key: 'form.password', locale: 'en-US', value: 'Password', description: 'Form label: Password' },
    { key: 'form.submit', locale: 'en-US', value: 'Submit', description: 'Form button: Submit' },
    { key: 'form.cancel', locale: 'en-US', value: 'Cancel', description: 'Form button: Cancel' },
    { key: 'error.generic', locale: 'en-US', value: 'Something went wrong. Please try again.', description: 'Generic error message' },
    { key: 'error.notFound', locale: 'en-US', value: 'Page not found', description: '404 error message' },
    { key: 'success.saved', locale: 'en-US', value: 'Successfully saved!', description: 'Success message after save' },

    // Japanese translations
    { key: 'app.welcome', locale: 'ja-JP', value: 'アプリケーションへようこそ！', description: 'Main welcome message' },
    { key: 'app.login', locale: 'ja-JP', value: 'ログイン', description: 'Login button text' },
    { key: 'app.logout', locale: 'ja-JP', value: 'ログアウト', description: 'Logout button text' },
    { key: 'app.signup', locale: 'ja-JP', value: '新規登録', description: 'Signup button text' },
    { key: 'nav.home', locale: 'ja-JP', value: 'ホーム', description: 'Navigation: Home' },
    { key: 'nav.dashboard', locale: 'ja-JP', value: 'ダッシュボード', description: 'Navigation: Dashboard' },
    { key: 'nav.settings', locale: 'ja-JP', value: '設定', description: 'Navigation: Settings' },
    { key: 'nav.profile', locale: 'ja-JP', value: 'プロフィール', description: 'Navigation: Profile' },
    { key: 'form.email', locale: 'ja-JP', value: 'メールアドレス', description: 'Form label: Email' },
    { key: 'form.password', locale: 'ja-JP', value: 'パスワード', description: 'Form label: Password' },
    { key: 'form.submit', locale: 'ja-JP', value: '送信', description: 'Form button: Submit' },
    { key: 'form.cancel', locale: 'ja-JP', value: 'キャンセル', description: 'Form button: Cancel' },
    { key: 'error.generic', locale: 'ja-JP', value: '問題が発生しました。もう一度お試しください。', description: 'Generic error message' },
    { key: 'error.notFound', locale: 'ja-JP', value: 'ページが見つかりません', description: '404 error message' },
    { key: 'success.saved', locale: 'ja-JP', value: '保存に成功しました！', description: 'Success message after save' },

    // Spanish translations
    { key: 'app.welcome', locale: 'es-ES', value: '¡Bienvenido a nuestra aplicación!', description: 'Main welcome message' },
    { key: 'app.login', locale: 'es-ES', value: 'Iniciar sesión', description: 'Login button text' },
    { key: 'app.logout', locale: 'es-ES', value: 'Cerrar sesión', description: 'Logout button text' },
    { key: 'app.signup', locale: 'es-ES', value: 'Registrarse', description: 'Signup button text' },
    { key: 'nav.home', locale: 'es-ES', value: 'Inicio', description: 'Navigation: Home' },
    { key: 'nav.dashboard', locale: 'es-ES', value: 'Panel de control', description: 'Navigation: Dashboard' },
    { key: 'nav.settings', locale: 'es-ES', value: 'Configuración', description: 'Navigation: Settings' },
  ]

  for (const str of webAppStrings) {
    await prisma.localeString.create({
      data: {
        projectId: webAppProject.id,
        ...str,
      },
    })
  }

  // Create some mobile app strings
  const mobileAppStrings = [
    { key: 'app.title', locale: 'en-US', value: 'Mobile App', description: 'App title' },
    { key: 'app.title', locale: 'ja-JP', value: 'モバイルアプリ', description: 'App title' },
    { key: 'notifications.enabled', locale: 'en-US', value: 'Notifications enabled', description: 'Notification status' },
    { key: 'notifications.enabled', locale: 'ja-JP', value: '通知が有効になりました', description: 'Notification status' },
  ]

  for (const str of mobileAppStrings) {
    await prisma.localeString.create({
      data: {
        projectId: mobileAppProject.id,
        ...str,
      },
    })
  }

  // Create glossary terms
  console.log('📚 Creating glossary terms...')

  const glossaryTerms = [
    {
      sourceTerm: 'dashboard',
      sourceLocale: 'en-US',
      targetTerm: 'ダッシュボード',
      targetLocale: 'ja-JP',
      notes: 'Use katakana consistently for UI terminology',
      tagsJson: JSON.stringify(['ui', 'navigation']),
    },
    {
      sourceTerm: 'settings',
      sourceLocale: 'en-US',
      targetTerm: '設定',
      targetLocale: 'ja-JP',
      notes: 'Use kanji for this common term',
      tagsJson: JSON.stringify(['ui', 'navigation']),
    },
    {
      sourceTerm: 'profile',
      sourceLocale: 'en-US',
      targetTerm: 'プロフィール',
      targetLocale: 'ja-JP',
      notes: 'Use katakana for English loanword',
      tagsJson: JSON.stringify(['ui', 'user']),
    },
    {
      sourceTerm: 'account',
      sourceLocale: 'en-US',
      targetTerm: 'アカウント',
      targetLocale: 'ja-JP',
      notes: 'Standard katakana transliteration',
      tagsJson: JSON.stringify(['ui', 'user']),
    },
    {
      sourceTerm: 'log in',
      sourceLocale: 'en-US',
      targetTerm: 'ログイン',
      targetLocale: 'ja-JP',
      notes: 'Always use this katakana form',
      tagsJson: JSON.stringify(['auth', 'action']),
    },
    {
      sourceTerm: 'sign up',
      sourceLocale: 'en-US',
      targetTerm: '新規登録',
      targetLocale: 'ja-JP',
      notes: 'Use this formal kanji form for registration',
      tagsJson: JSON.stringify(['auth', 'action']),
    },
    {
      sourceTerm: 'dashboard',
      sourceLocale: 'en-US',
      targetTerm: 'panel de control',
      targetLocale: 'es-ES',
      notes: 'Standard Spanish translation',
      tagsJson: JSON.stringify(['ui', 'navigation']),
    },
    {
      sourceTerm: 'settings',
      sourceLocale: 'en-US',
      targetTerm: 'configuración',
      targetLocale: 'es-ES',
      notes: 'Use lowercase unless at start of sentence',
      tagsJson: JSON.stringify(['ui', 'navigation']),
    },
  ]

  for (const term of glossaryTerms) {
    await prisma.glossaryTerm.create({
      data: {
        projectId: webAppProject.id,
        ...term,
      },
    })
  }

  console.log('✅ Database seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`  - Projects: ${await prisma.project.count()}`)
  console.log(`  - Locale Strings: ${await prisma.localeString.count()}`)
  console.log(`  - Glossary Terms: ${await prisma.glossaryTerm.count()}`)
  console.log('\n🎯 Demo Projects:')
  console.log(`  - Web App: http://localhost:3000/projects/${webAppProject.id}/strings`)
  console.log(`  - Mobile App: http://localhost:3000/projects/${mobileAppProject.id}/strings`)
  console.log(`  - Marketing: http://localhost:3000/projects/${marketingProject.id}/strings`)
  console.log('\n🔗 API Endpoints:')
  console.log(`  - Export (EN): http://localhost:3000/api/export/my-web-app?locale=en-US`)
  console.log(`  - Export (JA): http://localhost:3000/api/export/my-web-app?locale=ja-JP`)
  console.log(`  - Glossary: http://localhost:3000/api/glossary/my-web-app?sourceLocale=en-US&targetLocale=ja-JP`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
