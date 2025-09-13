// TODO: wire to Axios instance
export const InvoicesApi = {
  list: async () => { /* return await axios.get('/api/v1/invoices') */ return []; },
  create: async (_payload: any) => { /* ... */ },
  detail: async (_id: string) => { /* ... */ },
  update: async (_id: string, _payload: any) => { /* ... */ },
  status: async (_id: string, _status: string) => { /* ... */ },
  pdfGet: async (_id: string) => { /* ... */ },
  pdfSave: async (_id: string) => { /* ... */ },
};
