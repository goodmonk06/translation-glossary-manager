import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          Translation & Glossary Manager
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Centralize translatable strings and glossary terms
        </p>
        <div className="pt-4">
          <Link
            href="/projects"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  )
}
