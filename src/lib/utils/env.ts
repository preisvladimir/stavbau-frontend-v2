export function getEnv(key: string) {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  if (!v) console.warn(`ENV ${key} is not set`);
  return v as string;
}
