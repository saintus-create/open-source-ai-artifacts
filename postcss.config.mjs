/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
    },
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
                colormin: true,
                minifyFontValues: true,
                minifyGradients: true,
              },
            ],
          },
        }
      : {}),
  },
}

export default config
