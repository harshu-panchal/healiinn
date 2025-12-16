import { IoShieldCheckmarkOutline, IoLockClosedOutline, IoCheckmarkCircleOutline, IoArrowBackOutline, IoDocumentTextOutline, IoFlaskOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryHIPAACompliance = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoShieldCheckmarkOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  HIPAA Compliance
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Health Insurance Portability and Accountability Act
                </p>
              </div>
            </div>
          </div>

          {/* Content with Animations */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 p-10 space-y-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Overview */}
            <section>
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-2xl p-8 border-l-4 border-emerald-500 shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                    <IoShieldCheckmarkOutline className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Commitment</h2>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      Healiinn is fully committed to HIPAA compliance and ensuring the highest standards of 
                      patient data protection for diagnostic laboratories. We implement comprehensive security 
                      measures to safeguard Protected Health Information (PHI) in accordance with HIPAA regulations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-blue-600 text-white shadow-lg">
                  <IoLockClosedOutline className="h-6 w-6" />
                </div>
                Security Measures
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: IoLockClosedOutline, title: 'Encryption', desc: 'All PHI and test results are encrypted both in transit and at rest using industry-standard encryption protocols.', bg: 'from-blue-50 to-white', border: 'border-blue-200', iconBg: 'bg-blue-500' },
                  { icon: IoShieldCheckmarkOutline, title: 'Access Controls', desc: 'Strict access controls ensure only authorized laboratory personnel can access patient information and test results.', bg: 'from-emerald-50 to-white', border: 'border-emerald-200', iconBg: 'bg-emerald-500' },
                  { icon: IoDocumentTextOutline, title: 'Audit Logs', desc: 'Comprehensive audit logs track all access to PHI and test results for compliance monitoring and security.', bg: 'from-purple-50 to-white', border: 'border-purple-200', iconBg: 'bg-purple-500' },
                  { icon: IoFlaskOutline, title: 'Secure Infrastructure', desc: 'Our infrastructure meets HIPAA requirements with regular security assessments and compliance audits.', bg: 'from-indigo-50 to-white', border: 'border-indigo-200', iconBg: 'bg-indigo-500' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`bg-gradient-to-br ${item.bg} rounded-2xl p-6 border-2 ${item.border} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg} text-white mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Laboratory Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <IoFlaskOutline className="h-6 w-6" />
                </div>
                Laboratory Responsibilities
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <p className="text-slate-700 font-semibold mb-4 text-lg">As a laboratory using our platform, you must:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Maintain secure access to patient information',
                    'Follow proper data handling procedures',
                    'Report any security incidents immediately',
                    'Train staff on HIPAA compliance',
                    'Conduct regular security assessments',
                    'Maintain Business Associate Agreements'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <IoCheckmarkCircleOutline className="h-6 w-6 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p className="text-slate-700 font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Compliance Certification */}
            <section className={`bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoShieldCheckmarkOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">HIPAA Compliant Platform</h3>
                  <p className="text-emerald-50 mb-4">
                    Healiinn maintains full HIPAA compliance and undergoes regular audits to ensure continued adherence to all regulations.
                  </p>
                  <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 border border-white/20">
                    <IoCheckmarkCircleOutline className="h-6 w-6 text-white" />
                    <span className="font-semibold">Certified HIPAA Compliant</span>
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

export default LaboratoryHIPAACompliance

