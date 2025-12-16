import { IoDocumentTextOutline, IoCheckmarkCircleOutline, IoWarningOutline, IoArrowBackOutline, IoShieldCheckmarkOutline, IoLockClosedOutline, IoWalletOutline, IoFlaskOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryTermsOfService = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
                <IoDocumentTextOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#11496c] to-amber-600 bg-clip-text text-transparent">
                  Terms of Service
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Last updated: January 2025
                </p>
              </div>
            </div>
          </div>

          {/* Content with Animations */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 p-10 space-y-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Introduction */}
            <section className="group">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-[#11496c] to-amber-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900">Agreement to Terms</h2>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-l-4 border-[#11496c] shadow-sm">
                <p className="text-slate-700 leading-relaxed text-lg">
                  By accessing and using the <span className="font-semibold text-[#11496c]">Healiinn</span> platform, you agree to be bound by these Terms of Service. 
                  If you do not agree with any part of these terms, you may not access or use our services.
                </p>
              </div>
            </section>

            {/* Account Requirements */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <IoCheckmarkCircleOutline className="h-6 w-6" />
                </div>
                Account Requirements
              </h2>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-200 shadow-lg">
                <p className="text-slate-700 font-semibold mb-4 text-lg">To use our platform, you must:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Be a licensed diagnostic laboratory',
                    'Provide accurate and complete registration information',
                    'Maintain the security of your account credentials',
                    'Comply with all applicable laboratory regulations',
                    'Keep your accreditation and certifications up to date'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p className="text-slate-700 font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Service Usage */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-[#11496c] to-amber-600 rounded-full"></div>
                Service Usage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <IoCheckmarkCircleOutline className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-semibold text-slate-800">Permitted Uses</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Process test orders and generate reports',
                      'Manage laboratory inventory and equipment',
                      'Communicate with patients and healthcare providers',
                      'Process payments and manage earnings',
                      'Maintain quality control records'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 border-2 border-red-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <IoWarningOutline className="h-8 w-8 text-red-600" />
                    <h3 className="text-xl font-semibold text-slate-800">Prohibited Uses</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Share test results without proper authorization',
                      'Violate patient privacy or HIPAA regulations',
                      'Use the platform for illegal activities',
                      'Manipulate test results or reports',
                      'Interfere with platform security or operations'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <IoWalletOutline className="h-6 w-6" />
                </div>
                Payment Terms
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <div className="space-y-4">
                  {[
                    { title: 'Payment Processing', desc: 'Payments for test orders are processed securely. You will receive payment after test completion and report delivery.' },
                    { title: 'Transaction Fees', desc: 'A small transaction fee may apply to payments. Detailed fee structure is available in your Wallet section.' },
                    { title: 'Withdrawals', desc: 'You can withdraw your earnings to your registered bank account. Withdrawals are processed within 2-3 business days.' },
                    { title: 'Refunds', desc: 'Refund policies apply based on test cancellation or quality issues. Contact support for refund requests.' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <h4 className="font-semibold text-slate-800 mb-2">{item.title}</h4>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className={`bg-gradient-to-br from-[#11496c] to-[#0d3a52] rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoDocumentTextOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Questions About Terms?</h3>
                  <p className="text-slate-200 mb-4">
                    If you have any questions about these Terms of Service, please contact us.
                  </p>
                  <div className="space-y-2 text-slate-200">
                    <p><span className="font-semibold">Email:</span> legal@healiinn.com</p>
                    <p><span className="font-semibold">Phone:</span> +1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaboratoryTermsOfService

