import api from "@/services/api";

export const paymentService = {

    getPaymentMethods: async () => {
        const { data } = await api.get('payment/admin/summary/');
        return data?.methods ?? [];
    },
    addPaymentMethod: async (formData) => {
        const { data } = await api.post('Payment/methods/create/admin/', formData);
        return data;
    },
    updatePaymentMethod: async (methodId, formData) => {
        const { data } = await api.put(`Payment/methods/update/admin/${methodId}/`, formData);
        return data;
    },
    deletePaymentMethod: async (methodId) => {
        const { data } = await api.delete(`Payment/methods/delete/admin/${methodId}/`);
        return data;
    }
};