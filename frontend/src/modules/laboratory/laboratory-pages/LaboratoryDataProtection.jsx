import { IoLockClosedOutline, IoShieldCheckmarkOutline, IoKeyOutline, IoArrowBackOutline, IoCheckmarkCircleOutline, IoGlobeOutline, IoDocumentTextOutline, IoFlaskOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryDataProtection = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-indigo-600 text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoLockClosedOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#11496c] to-indigo-600 bg-clip-text text-transparent">
                  Data Protection
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  How we protect your laboratory and patient data
                </p>
              </div>
            </div>
          </div>

          {/* Content with Animations */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 p-10 space-y-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Overview */}
            <section>
              <div className="bg-gradient-to-r from-[#11496c] via-indigo-600 to-[#11496c] rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <IoShieldCheckmarkOutline className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Our Data Protection Commitment</h2>
                    <p className="text-slate-200 leading-relaxed text-lg">
                      At Healiinn, we take data protection seriously. We implement comprehensive security 
                      measures and follow industry best practices to ensure your laboratory information, 
                      test data, and patient information remains secure and confidential.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-indigo-600 text-white shadow-lg">
                  <IoKeyOutline className="h-6 w-6" />
                </div>
                Security Measures
              </h2>
              <div className="space-y-4">
                {[
                  { icon: IoLockClosedOutline, title: 'Encryption', desc: 'All sensitive data including test results and patient information is encrypted using AES-256 encryption, both in transit (TLS/SSL) and at rest. This ensures that even if data is intercepted, it cannot be read without the encryption keys.', bg: 'from-blue-50 via-white to-blue-50', border: 'border-blue-500', iconBg: 'bg-blue-500' },
                  { icon: IoShieldCheckmarkOutline, title: 'Access Controls', desc: 'Multi-factor authentication and role-based access controls ensure that only authorized laboratory personnel can access sensitive information. All access attempts are logged and monitored.', bg: 'from-emerald-50 via-white to-emerald-50', border: 'border-emerald-500', iconBg: 'bg-emerald-500' },
                  { icon: IoDocumentTextOutline, title: 'Regular Security Audits', desc: 'We conduct regular security audits, penetration testing, and vulnerability assessments to identify and address potential security issues before they can be exploited.', bg: 'from-purple-50 via-white to-purple-50', border: 'border-purple-500', iconBg: 'bg-purple-500' },
                  { icon: IoFlaskOutline, title: 'Secure Infrastructure', desc: 'Our infrastructure is hosted on secure, compliant cloud platforms with redundant backups and disaster recovery procedures in place to protect your laboratory data.', bg: 'from-amber-50 via-white to-amber-50', border: 'border-amber-500', iconBg: 'bg-amber-500' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`bg-gradient-to-r ${item.bg} rounded-2xl p-6 border-l-4 ${item.border} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconBg} text-white shadow-lg`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <IoGlobeOutline className="h-6 w-6" />
                </div>
                Your Rights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Access Your Data', desc: 'You have the right to access all your laboratory data and information stored on our platform.' },
                  { title: 'Data Correction', desc: 'You can request corrections to any inaccurate information in your account or laboratory profile.' },
                  { title: 'Data Deletion', desc: 'You can request deletion of your data, subject to legal and regulatory retention requirements.' },
                  { title: 'Data Portability', desc: 'You can export your laboratory data in a machine-readable format for transfer to other platforms.' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <IoCheckmarkCircleOutline className="h-6 w-6 text-indigo-600" />
                      <h3 className="text-xl font-semibold text-slate-800">{item.title}</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* International Standards */}
            <section className={`bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoShieldCheckmarkOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">International Standards</h3>
                  <p className="text-indigo-50 mb-4">
                    Our data protection practices comply with international standards including GDPR, HIPAA, and CLIA regulations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['HIPAA Compliant', 'GDPR Aligned', 'CLIA Certified'].map((badge, idx) => (
                      <div key={idx} className="bg-white/10 rounded-xl p-4 border border-white/20 text-center">
                        <p className="font-semibold">{badge}</p>
                      </div>
                    ))}
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

export default LaboratoryDataProtection

