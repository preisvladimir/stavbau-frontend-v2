// TODO: wire to Axios instance
export const FilesApi = {
  list: async () => { /* ... */ return []; },
  upload: async (_file: File) => { /* ... */ },
  download: async (_id: string) => { /* ... */ },
  del: async (_id: string) => { /* ... */ },
  setTags: async (_id: string, _tags: string[]) => { /* ... */ },
  link: async (_id: string, _target: { type: 'COMPANY'|'PROJECT'|'INVOICE', id: string }) => { /* ... */ },
};
