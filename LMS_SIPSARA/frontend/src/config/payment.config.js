// src/config/payment.config.js
import api from "@/services/api";

export const paymentService = {

  getAdminPaymentRecords: async (params = {}) => {
    const response = await api.get("payment/payment-records/", { params });
    return response.data;
  },

  downloadAdminPaymentsPdf: async (params = {}) => {
    const response = await api.get("payment/payment-records/", {
      params: { ...params, export: "pdf" },
      responseType: "blob",
    });
    return response.data; 
  },

  getPaymentMethods: async () => {
    const response = await api.get("payment/pay/gateways/");
    return response.data;
  },
  getFinancialStats: async (period = 'monthly') => {
    const { data } = await api.get(`payment/dashboard/financial-stats/?period=${period}`);
    return data ?? [];
  },
  
  getTeacherPayments: async (params = {}) => {
    const response = await api.get("payment/teacher/transactions/", { params });
    return response.data;
  },
   getCart: async () => {
    const { data } = await api.get("payment/cart/");
    return data;
  },

  postCartAdd: async (course_id) => {
    const { data } = await api.post("payment/cart/add/", { course_id });
    return data;
  },

  deleteCartItem: async (cartItemId) => {
    const { data } = await api.delete(`payment/cart/${cartItemId}/`);
    return data;
  },

  deleteCartClear: async () => {
    const { data } = await api.delete("payment/cart/clear/");
    return data;
  },

  // ORDERS
  postCreateOrder: async (payload = { coupon_code: "" }) => {
    const { data } = await api.post("payment/orders/create/", payload);
    return data;
  },

  getOrders: async () => {
    const { data } = await api.get("payment/orders/");
    return data;
  },

  getOrderDetail: async (oid) => {
    const { data } = await api.get(`payment/orders/${oid}/`);
    return data;
  },

  // PAYMENT INTENT
  postCreatePaymentIntent: async (order_id) => {
    const { data } = await api.post("payment/create-payment-intent/", { order_id });
    return data;
  },

  // CONFIRM PAYMENT (after stripe confirm)
  postConfirmPayment: async (payment_intent_id) => {
    const { data } = await api.post("payment/confirm-payment/", { payment_intent_id });
    return data;
  },
  addToCart: async (courseId) => {
  const { data } = await api.post("payment/cart/add/", { course_id: courseId });
  return data;
},
  addToCart: async (courseId) => {
    // IMPORTANT: backend expects course_id
    const { data } = await api.post("payment/cart/add/", { course_id: courseId });
    return data;
  },

  getCart: async () => {
    const { data } = await api.get("payment/cart/");
    return data;
  },

  removeFromCart: async (cartItemId) => {
    const { data } = await api.delete(`payment/cart/${cartItemId}/`);
    return data;
  },

  clearCart: async () => {
    const { data } = await api.delete("payment/cart/clear/");
    return data;
  },

  // ---------------- CHECKOUT ----------------
  // If your backend has a payment intent endpoint, keep this.
  createPaymentIntent: async () => {
    const { data } = await api.post("payment/payment-intent/");
    return data;
  },

  // Optional: if you have confirm payment endpoint
  confirmPayment: async (payload) => {
    const { data } = await api.post("payment/confirm-payment/", payload);
    return data;
  },



};
