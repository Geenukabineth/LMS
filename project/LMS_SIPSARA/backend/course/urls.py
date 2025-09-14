from django.urls import path
from .views import *




urlpatterns [
    path("course/category/", CategoryListAPIView.as_view()),
    path("course/course-list/", CourseListAPIView.as_view()),
    path("course/search/", SearchCourseAPIView.as_view()),
    path("course/course-detail/<slug>/", CourseDetailAPIView.as_view()),
    path("course/cart/", CartAPIView.as_view()),
    path("course/cart-list/<cart_id>/", CartListAPIView.as_view()),
    path("cart/stats/<cart_id>/", CartStatsAPIView.as_view()),
    path("course/cart-item-delete/<cart_id>/<item_id>/", CartItemDeleteAPIView.as_view()),
    path("order/create-order/", CreateOrderAPIView.as_view()),
    path("order/checkout/<oid>/", CheckoutAPIView.as_view()),
    path("order/coupon/", CouponApplyAPIView.as_view()),
    path("payment/stripe-checkout/<order_oid>/", StripeCheckoutAPIView.as_view()),
    path("payment/payment-sucess/", PaymentSuccessAPIView.as_view()),



    path("student/summary/<user_id>/", api_views.StudentSummaryAPIView.as_view()),
    path("student/course-list/<user_id>/", api_views.StudentCourseListAPIView.as_view()),
    path("student/course-detail/<user_id>/<enrollment_id>/", api_views.StudentCourseDetailAPIView.as_view()),
    path("student/course-completed/", api_views.StudentCourseCompletedCreateAPIView.as_view()),
    path("student/course-note/<user_id>/<enrollment_id>/", api_views.StudentNoteCreateAPIView.as_view()),
    path("student/course-note-detail/<user_id>/<enrollment_id>/<note_id>/", api_views.StudentNoteDetailAPIView.as_view()),
    path("student/rate-course/", api_views.StudentRateCourseCreateAPIView.as_view()),
    path("student/review-detail/<user_id>/<review_id>/", api_views.StudentRateCourseUpdateAPIView.as_view()),
    path("student/wishlist/<user_id>/", api_views.StudentWishListListCreateAPIView.as_view()),
    path("student/question-answer-list-create/<course_id>/", api_views.QuestionAnswerListCreateAPIView.as_view()),
    path("student/question-answer-message-create/", api_views.QuestionAnswerMessageSendAPIView.as_view()),

]