'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Scale, Eye, EyeOff, AlertCircle, ShieldCheck,
  User, Mail, Phone, CreditCard, Lock, Users, Briefcase,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const registroSchema = z
  .object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Ingresa un email válido'),
    telefono: z
      .string()
      .min(10, 'El teléfono debe tener al menos 10 dígitos')
      .regex(/^[0-9+\s-]+$/, 'Solo se permiten números, +, espacios y guiones'),
    cedula: z
      .string()
      .min(6, 'La cédula debe tener al menos 6 dígitos')
      .max(12, 'La cédula no puede tener más de 12 dígitos')
      .regex(/^[0-9]+$/, 'Solo se permiten números'),
    tipo: z.enum(['ciudadano', 'abogado'], {
      required_error: 'Selecciona el tipo de cuenta',
    }),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmarPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  })

type RegistroFormData = z.infer<typeof registroSchema>

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8 caracteres mínimo', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]
  const strength = checks.filter((c) => c.ok).length
  const colors = ['bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500']
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}
          >
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function RegistroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const { register: authRegister } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: { tipo: 'ciudadano' },
  })

  const passwordValue = watch('password', '')
  const tipoValue = watch('tipo')

  const onSubmit = async (data: RegistroFormData) => {
    try {
      setServerError('')
      await authRegister({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        cedula: data.cedula,
        tipo: data.tipo,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setServerError(
        error?.response?.data?.detail ||
          'Error al crear la cuenta. Intenta nuevamente.'
      )
    }
  }

  const fieldClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 h-11 rounded-lg border text-sm transition-colors outline-none
    focus:ring-2 focus:ring-primary focus:border-transparent
    ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-border hover:border-primary-400'}`

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 gradient-hero text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-16">
            <Scale className="w-8 h-8 text-secondary" />
            <span className="text-2xl font-bold">ConsultorioLegal</span>
          </Link>
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            Únete a la comunidad legal digital de Colombia
          </h1>
          <p className="text-blue-100 mb-8">
            Más de 50.000 usuarios ya confían en nosotros para resolver sus problemas legales.
          </p>

          {/* Tipo cards */}
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-secondary" />
                <span className="font-semibold">Para Ciudadanos</span>
              </div>
              <p className="text-blue-100 text-sm">
                Accede a consultas legales, documentos y seguimiento de tus procesos.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-5 h-5 text-secondary" />
                <span className="font-semibold">Para Abogados</span>
              </div>
              <p className="text-blue-100 text-sm">
                Amplía tu cliente base digital, gestiona consultas y recibe pagos automáticos.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-blue-300">
          Datos protegidos bajo la Ley 1581 de 2012 · SSL Encriptado
        </p>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background-secondary overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Scale className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">ConsultorioLegal</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-card p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-primary mb-1">Crear cuenta</h2>
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
                  Inicia sesión
                </Link>
              </p>
            </div>

            {serverError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Tipo de cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de cuenta
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'ciudadano', label: 'Ciudadano', Icon: Users },
                    { value: 'abogado', label: 'Abogado', Icon: Briefcase },
                  ].map(({ value, label, Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        tipoValue === value
                          ? 'border-primary bg-primary-50'
                          : 'border-border hover:border-primary-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={value}
                        className="sr-only"
                        {...register('tipo')}
                      />
                      <Icon
                        className={`w-5 h-5 ${tipoValue === value ? 'text-primary' : 'text-gray-400'}`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          tipoValue === value ? 'text-primary' : 'text-gray-600'
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.tipo && (
                  <p className="text-xs text-red-500 mt-1">{errors.tipo.message}</p>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Juan David Pérez"
                    autoComplete="name"
                    className={fieldClass(!!errors.nombre)}
                    {...register('nombre')}
                  />
                </div>
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    className={fieldClass(!!errors.email)}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              {/* Teléfono y Cédula */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="3001234567"
                      autoComplete="tel"
                      className={fieldClass(!!errors.telefono)}
                      {...register('telefono')}
                    />
                  </div>
                  {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cédula / NIT
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="1234567890"
                      className={fieldClass(!!errors.cedula)}
                      {...register('cedula')}
                    />
                  </div>
                  {errors.cedula && <p className="text-xs text-red-500 mt-1">{errors.cedula.message}</p>}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${fieldClass(!!errors.password)} pr-12`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordValue && <PasswordStrength password={passwordValue} />}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirmar password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${fieldClass(!!errors.confirmarPassword)} pr-12`}
                    {...register('confirmarPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmarPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmarPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white font-semibold rounded-lg hover:bg-primary-800
                           transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando cuenta...
                  </>
                ) : 'Crear mi cuenta'}
              </button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Al registrarte aceptas nuestros{' '}
              <Link href="/terminos" className="text-primary hover:underline underline-offset-4">Términos</Link>{' '}
              y{' '}
              <Link href="/privacidad" className="text-primary hover:underline underline-offset-4">
                Política de privacidad
              </Link>
              {' '}conforme a la Ley 1581 de 2012.
            </p>
          </div>

          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Datos protegidos · SSL 256-bit · Ley 1581</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
