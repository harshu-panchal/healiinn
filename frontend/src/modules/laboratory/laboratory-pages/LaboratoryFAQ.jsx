import { IoHelpCircleOutline, IoArrowBackOutline, IoChevronDownOutline, IoChevronUpOutline, IoSearchOutline, IoFlaskOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const faqCategories = [
  {
    id: 'general',
    title: 'General Questions',
    icon: IoHelpCircleOutline,
    color: 'from-blue-500 to-blue-600',
    questions: [
      {
        id: 'q1',
        question: 'How do I get started with Healiinn?',
        answer: 'Getting started is easy! Simply register your laboratory account, complete your profile verification with accreditation details, and you can start receiving test orders. Our onboarding process guides you through each step.',
      },
      {
        id: 'q2',
        question: 'What features are available for laboratories?',
        answer: 'Healiinn offers comprehensive features including test order management, report generation, patient management, inventory tracking, wallet management, and detailed analytics. All features are designed to streamline your laboratory operations.',
      },
      {
        id: 'q3',
        question: 'Is my data secure?',
        answer: 'Yes, absolutely! We use industry-standard encryption and follow HIPAA compliance guidelines. Your patient data and laboratory information are protected with advanced security measures and regular security audits.',
      },
      {
        id: 'q4',
        question: 'Can I customize my laboratory profile?',
        answer: 'Yes, you can fully customize your profile including laboratory information, available tests, pricing, operating hours, and professional qualifications. All changes can be made from your Profile section.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Test Orders & Processing',
    icon: IoHelpCircleOutline,
    color: 'from-emerald-500 to-emerald-600',
    questions: [
      {
        id: 'q5',
        question: 'How do I receive test orders?',
        answer: 'Test orders are automatically sent to your laboratory when patients or doctors request tests. You\'ll receive notifications for new orders and can view them in the Orders section.',
      },
      {
        id: 'q6',
        question: 'How do I process a test order?',
        answer: 'Once you receive an order, confirm it, collect the sample (if needed), perform the test, and generate the report. Upload the report through the platform and it will be automatically shared with the patient and ordering physician.',
      },
      {
        id: 'q7',
        question: 'What if I need to cancel an order?',
        answer: 'You can cancel orders from the Orders page if necessary. Patients and doctors will be notified automatically. Refund policies apply based on the cancellation reason.',
      },
      {
        id: 'q8',
        question: 'How long do I have to complete a test?',
        answer: 'Test completion times vary by test type. Standard tests should be completed within 24-48 hours. Urgent tests may have shorter timeframes. Check the order details for specific requirements.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Results',
    icon: IoHelpCircleOutline,
    color: 'from-purple-500 to-purple-600',
    questions: [
      {
        id: 'q9',
        question: 'How do I generate test reports?',
        answer: 'After completing a test, navigate to the Test Reports section, select the order, and use the report generation tool. Include all required test parameters, results, and reference ranges.',
      },
      {
        id: 'q10',
        question: 'What format should reports be in?',
        answer: 'Reports should be in PDF format and include laboratory letterhead, test results, reference ranges, and any necessary interpretations. Templates are available in the platform.',
      },
      {
        id: 'q11',
        question: 'Can I view past reports?',
        answer: 'Yes, all generated reports are stored in your Reports section. You can search, filter, and view historical reports for any patient or time period.',
      },
      {
        id: 'q12',
        question: 'How do patients receive their reports?',
        answer: 'Reports are automatically shared with patients and ordering physicians through the platform. Patients receive notifications and can download reports from their account.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Wallet',
    icon: IoHelpCircleOutline,
    color: 'from-amber-500 to-amber-600',
    questions: [
      {
        id: 'q13',
        question: 'How do I receive payments?',
        answer: 'Payments are automatically processed through the platform. Test fees are credited to your wallet after report delivery. You can view all transactions in your Wallet section.',
      },
      {
        id: 'q14',
        question: 'How do I withdraw my earnings?',
        answer: 'You can withdraw your earnings from the Wallet section. Navigate to the Withdraw tab, enter the amount, and provide your bank details. Withdrawals are processed within 2-3 business days.',
      },
      {
        id: 'q15',
        question: 'What payment methods are supported?',
        answer: 'We support multiple payment methods including bank transfers, UPI, and digital wallets. All payment methods are secure and comply with financial regulations.',
      },
      {
        id: 'q16',
        question: 'Are there any transaction fees?',
        answer: 'Transaction fees may apply depending on the payment method and amount. Detailed fee structure is available in your Wallet section. We maintain transparency in all financial transactions.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: IoHelpCircleOutline,
    color: 'from-indigo-500 to-indigo-600',
    questions: [
      {
        id: 'q17',
        question: 'What if I face technical issues?',
        answer: 'If you encounter any technical issues, you can contact our support team through the Support section. We provide 24/7 technical assistance to ensure smooth operation of the platform.',
      },
      {
        id: 'q18',
        question: 'Is there a mobile app?',
        answer: 'Currently, Healiinn is available as a web application optimized for all devices. We are working on dedicated mobile apps for iOS and Android, which will be available soon.',
      },
      {
        id: 'q19',
        question: 'Can I use the platform offline?',
        answer: 'Some features require an internet connection for real-time updates. However, you can view previously loaded data offline. We recommend maintaining a stable internet connection for the best experience.',
      },
      {
        id: 'q20',
        question: 'How do I update my account information?',
        answer: 'You can update your account information anytime from the Profile section. Changes to critical information may require verification. All updates are saved automatically.',
      },
    ],
  },
]

const LaboratoryFAQ = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [openQuestion, setOpenQuestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0)

  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-[#11496c]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Back Button */}
        <div className="max-w-5xl mx-auto px-8 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-[#11496c] hover:bg-white/80 transition-all duration-300 hover:shadow-md mb-6"
          >
            <IoArrowBackOutline className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-8 pb-16">
          {/* Animated Header */}
          <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoHelpCircleOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#11496c] to-blue-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Find answers to common questions
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110">
                <IoSearchOutline className="h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#11496c]/20 focus:border-[#11496c] transition-all duration-300 shadow-md hover:shadow-lg hover:border-[#11496c]/50"
              />
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {filteredCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon
              const delayClasses = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500']
              const delayClass = delayClasses[categoryIndex] || 'delay-100'
              return (
                <div
                  key={category.id}
                  className={`transition-all duration-700 ${delayClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
                          <p className="text-sm text-slate-500 mt-1">{category.questions.length} questions</p>
                        </div>
                      </div>
                      {openCategory === category.id ? (
                        <IoChevronUpOutline className="h-6 w-6 text-slate-400 transition-transform" />
                      ) : (
                        <IoChevronDownOutline className="h-6 w-6 text-slate-400 transition-transform" />
                      )}
                    </button>

                    {/* Category Questions */}
                    {openCategory === category.id && (
                      <div className="border-t border-slate-100 p-6 space-y-4">
                        {category.questions.map((faq, questionIndex) => (
                          <div
                            key={faq.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all duration-300 hover:shadow-md"
                          >
                            <button
                              onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                              className="w-full flex items-start justify-between p-5 text-left hover:bg-white/50 transition-colors rounded-xl"
                            >
                              <div className="flex-1 pr-4">
                                <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.question}</h3>
                                {openQuestion === faq.id && (
                                  <p className="text-sm text-slate-600 leading-relaxed mt-3 animate-fadeIn">
                                    {faq.answer}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                {openQuestion === faq.id ? (
                                  <IoChevronUpOutline className="h-5 w-5 text-[#11496c] transition-transform" />
                                ) : (
                                  <IoChevronDownOutline className="h-5 w-5 text-slate-400 transition-transform" />
                                )}
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Section */}
          <div className={`mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-gradient-to-br from-[#11496c] to-[#0d3a52] rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoHelpCircleOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                  <p className="text-slate-200 mb-4">
                    Can't find the answer you're looking for? Our support team is here to help you.
                  </p>
                  <button
                    onClick={() => navigate('/laboratory/support')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#11496c] font-semibold hover:bg-slate-100 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaboratoryFAQ

