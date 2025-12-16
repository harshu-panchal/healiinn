import { IoShieldCheckmarkOutline, IoLockClosedOutline, IoDocumentTextOutline, IoArrowBackOutline, IoCheckmarkCircleOutline, IoPersonOutline, IoFlaskOutline, IoChatbubbleOutline, IoStarOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryPrivacyPolicy = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
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
                <IoShieldCheckmarkOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#11496c] to-blue-600 bg-clip-text text-transparent">
                  Privacy Policy
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <IoDocumentTextOutline className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Introduction</h2>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-l-4 border-[#11496c] shadow-sm">
                <p className="text-slate-700 leading-relaxed text-lg">
                  At <span className="font-semibold text-[#11496c]">Healiinn</span>, we are committed to protecting your privacy and ensuring the security of your personal and laboratory information. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform as a diagnostic laboratory professional.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="group">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-[#11496c] to-blue-600 rounded-full"></div>
                Information We Collect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                      <IoPersonOutline className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Laboratory name, contact details, and accreditation information',
                      'License numbers and certifications',
                      'Bank account details for payment processing',
                      'Profile information and facility details'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 group/item">
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
                      <IoFlaskOutline className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Test Data</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Test orders and results',
                      'Patient test information (anonymized)',
                      'Quality control data',
                      'Equipment and inventory information'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 group/item">
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="group">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-[#11496c] to-blue-600 rounded-full"></div>
                How We Use Your Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Service Delivery', icon: IoFlaskOutline, color: 'blue', items: ['Process test orders', 'Generate reports', 'Manage inventory'] },
                  { title: 'Payment Processing', icon: IoStarOutline, color: 'emerald', items: ['Process payments', 'Handle transactions', 'Manage earnings'] },
                  { title: 'Communication', icon: IoChatbubbleOutline, color: 'purple', items: ['Send notifications', 'Provide support', 'Share updates'] }
                ].map((section, idx) => (
                  <div key={idx} className={`bg-gradient-to-br from-${section.color}-50 to-white rounded-2xl p-6 border border-${section.color}-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${section.color}-500 text-white`}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-[#11496c] mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Security */}
            <section className="group">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-[#11496c] to-blue-600 rounded-full"></div>
                Data Security
              </h2>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-l-4 border-emerald-500 shadow-md">
                <p className="text-slate-700 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="space-y-3">
                  {[
                    'End-to-end encryption for all data transmissions',
                    'Secure servers with regular security audits',
                    'Access controls and authentication protocols',
                    'Regular backups and disaster recovery procedures',
                    'HIPAA compliance and regulatory adherence'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <IoLockClosedOutline className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section className={`bg-gradient-to-br from-[#11496c] to-[#0d3a52] rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoShieldCheckmarkOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Questions About Privacy?</h3>
                  <p className="text-slate-200 mb-4">
                    If you have any questions or concerns about this Privacy Policy or our data practices, please contact us.
                  </p>
                  <div className="space-y-2 text-slate-200">
                    <p><span className="font-semibold">Email:</span> privacy@healiinn.com</p>
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

export default LaboratoryPrivacyPolicy

