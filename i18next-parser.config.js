module.exports = {
    defaultNamespace: 'translation',
    // Default namespace used in your i18next config
  
    indentation: 4,
    // Indentation of the catalog files
  
    locales: ['en'],
    // An array of the locales in your applications
  
    namespaceSeparator: ':',
    // Namespace separator used in your translation keys
    // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think that there are a namespace and three separator dots for instance.
  
    output: 'src/locales/$LOCALE/$NAMESPACE.json',
    // Supports $LOCALE and $NAMESPACE injection
    // Supports JSON (.json) and YAML (.yml) file formats
    // Where to write the locale files relative to process.cwd()
  
    input: "src/ts/**/*.{ts,tsx}",
    // An array of globs that describe where to look for source files
    // relative to the location of the configuration file
  
    sort: true,
    // Whether or not to sort the catalog
  
    useKeysAsDefaultValue: true,
    // Whether to use the keys as the default value; ex. "Hello": "Hello", "World": "World"
    // This option takes precedence over the `defaultValue` and `skipDefaultValues` options
    // You may also specify a function accepting the locale and namespace as arguments
  }