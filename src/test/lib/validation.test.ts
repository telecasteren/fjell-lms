import { describe, it, expect } from 'vitest'
import {
  passwordPolicy,
  userRegistrationSchema,
  userLoginSchema,
  emailUpdateSchema,
  userUpdateSchema,
  passwordChangeSchema,
  courseCreateSchema,
  validateRequestBody,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('passwordPolicy', () => {
    it('accepts valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure1@',
        'Test123#',
        'ComplexP@ss1',
      ]

      validPasswords.forEach(password => {
        expect(() => passwordPolicy.parse(password)).not.toThrow()
      })
    })

    it('rejects invalid passwords', () => {
      const invalidPasswords = [
        'password', // no uppercase, number, special char
        'PASSWORD', // no lowercase, number, special char
        'Password', // no number, special char
        'Password1', // no special char
        'Pass1!', // too short
        'P'.repeat(101), // too long
      ]

      invalidPasswords.forEach(password => {
        expect(() => passwordPolicy.parse(password)).toThrow()
      })
    })
  })

  describe('userRegistrationSchema', () => {
    it('validates correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Engineering',
      }

      expect(() => userRegistrationSchema.parse(validData)).not.toThrow()
    })

    it('rejects mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Different123!',
        department: 'Engineering',
      }

      expect(() => userRegistrationSchema.parse(invalidData)).toThrow()
    })

    it('rejects invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Engineering',
      }

      expect(() => userRegistrationSchema.parse(invalidData)).toThrow()
    })

    it('rejects empty name', () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Engineering',
      }

      expect(() => userRegistrationSchema.parse(invalidData)).toThrow()
    })
  })

  describe('userLoginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'Password123!',
      }

      expect(() => userLoginSchema.parse(validData)).not.toThrow()
    })

    it('rejects invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
      }

      expect(() => userLoginSchema.parse(invalidData)).toThrow()
    })

    it('rejects empty password', () => {
      const invalidData = {
        email: 'john@example.com',
        password: '',
      }

      expect(() => userLoginSchema.parse(invalidData)).toThrow()
    })
  })

  describe('emailUpdateSchema', () => {
    it('validates correct email update data', () => {
      const validData = {
        email: 'newemail@example.com',
      }

      expect(() => emailUpdateSchema.parse(validData)).not.toThrow()
    })

    it('rejects invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
      }

      expect(() => emailUpdateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('userUpdateSchema', () => {
    it('validates correct user update data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ADMIN',
      }

      expect(() => userUpdateSchema.parse(validData)).not.toThrow()
    })

    it('accepts partial update data', () => {
      const partialData = {
        name: 'John Doe',
      }

      expect(() => userUpdateSchema.parse(partialData)).not.toThrow()
    })

    it('rejects invalid role', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'INVALID_ROLE',
      }

      expect(() => userUpdateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('passwordChangeSchema', () => {
    it('validates correct password change data', () => {
      const validData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }

      expect(() => passwordChangeSchema.parse(validData)).not.toThrow()
    })

    it('rejects weak new password', () => {
      const invalidData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
      }

      expect(() => passwordChangeSchema.parse(invalidData)).toThrow()
    })

    it('rejects empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPassword123!',
      }

      expect(() => passwordChangeSchema.parse(invalidData)).toThrow()
    })
  })

  describe('courseCreateSchema', () => {
    it('validates correct course creation data', () => {
      const validData = {
        title: 'Introduction to React',
        description: 'Learn React fundamentals',
      }

      expect(() => courseCreateSchema.parse(validData)).not.toThrow()
    })

    it('accepts course without description', () => {
      const validData = {
        title: 'Introduction to React',
      }

      expect(() => courseCreateSchema.parse(validData)).not.toThrow()
    })

    it('rejects empty title', () => {
      const invalidData = {
        title: '',
        description: 'Learn React fundamentals',
      }

      expect(() => courseCreateSchema.parse(invalidData)).toThrow()
    })

    it('rejects title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        description: 'Learn React fundamentals',
      }

      expect(() => courseCreateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('validateRequestBody', () => {
    it('returns success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Engineering',
      }

      const result = validateRequestBody(userRegistrationSchema, validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('returns error for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
        department: '',
      }

      const result = validateRequestBody(userRegistrationSchema, invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Name is required')
        expect(result.error).toContain('Invalid email format')
        expect(result.error).toContain('Password must contain')
        expect(result.error).toContain("Passwords don't match")
      }
    })

    it('handles non-ZodError exceptions', () => {
      const result = validateRequestBody(userRegistrationSchema, null)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid input')
      }
    })
  })
})
