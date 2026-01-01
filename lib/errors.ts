export class ProviderConfigError extends Error {
  constructor(public provider: string, message: string) {
    super(message)
    this.name = 'ProviderConfigError'
  }
}
