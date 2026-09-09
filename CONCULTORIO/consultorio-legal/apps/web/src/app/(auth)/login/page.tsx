'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scale, Eye, EyeOff, AlertCircle, ShieldCheck, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError('')
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setServerError(
        error?.response?.data?.detail ||
          'Credenciales incorrectas. Verifica tu email y contraseña.'
      )
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-16">
            <Scale className="w-8 h-8 text-secondary" />
            <span className="text-2xl font-bold">ConsultorioLegal</span>
          </Link>

          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Tu derecho, al alcance de tu mano
          </h1>
          <p className="text-lg text-blue-100 mb-10">
            Miles de colombianos ya resuelven sus problemas legales desde casa. 
            Únete y accede a asesoría legal profesional hoy mismo.
          </p>

          <div className="space-y-4">
            {[
              'Abogados verificados por el Consejo Superior de la Judicatura',
              'Documentos legales generados en minutos',
              'Seguimiento en tiempo real de tus procesos',
              'Confidencialidad garantizada – Ley 1581',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-secondary">★</span>
            ))}
          </div>
          <p className="text-blue-100 text-sm italic mb-3">
            "Recuperé mi liquidación laboral en 2 semanas gracias a esta plataforma. 
            El abogado fue muy claro y el proceso completamente digital."
          </p>
          <p className="text-white text-sm font-semibold">— María P., Medellín</p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background-secondary">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Scale className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">ConsultorioLegal</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-card p-8 border border-border">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-1">Iniciar sesión</h2>
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link href="/registro" className="text-primary font-medium hover:underline underline-offset-4">
                  Regístrate gratis
                </Link>
              </p>
            </div>

            {serverError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.com"
                    className={`w-full pl-10 pr-4 h-11 rounded-lg border text-sm transition-colors outline-none
                      focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-border hover:border-primary-400'}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700" htmlFor="password">
                    Contraseña
                  </label>
                  <Link href="/recuperar-contrasena" className="text-xs text-primary hover:underline underline-offset-4">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 h-11 rounded-lg border text-sm transition-colors outline-none
                      focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-border hover:border-primary-400'}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full h-11 bg-primary text-white font-semibold rounded-lg hover:bg-primary-800
                           transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isSubmitting || isLoading) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </>
                ) : 'Ingresar a mi cuenta'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Al iniciar sesión aceptas nuestros{' '}
                <Link href="/terminos" className="text-primary hover:underline underline-offset-4">
                  Términos de uso
                </Link>{' '}
                y{' '}
                <Link href="/privacidad" className="text-primary hover:underline underline-offset-4">
                  Política de privacidad
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Conexión segura SSL · Ley 1581 de Protección de Datos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
