import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  combineValidationResults,
} from '@/lib/errors/validationHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export function ValidationExample() {
  const { handleError } = useErrorHandler({ showToast: true });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const nameValidation = validateRequired(formData.name, 'Nom');

    const result = combineValidationResults(
      emailValidation,
      passwordValidation,
      nameValidation
    );

    setErrors(result.errors);

    if (!result.isValid) {
      const firstError = Object.values(result.errors)[0];
      handleError(new Error(firstError), 'Erreur de validation');
      return;
    }

    console.log('Form is valid!', formData);
  };

  return (
    <div className="space-y-4 p-4 max-w-md">
      <h2 className="text-xl font-bold">Validation Error Handling Example</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.Nom ? 'border-destructive' : ''}
          />
          {errors.Nom && (
            <p className="text-sm text-destructive">{errors.Nom}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
          </p>
        </div>

        <Button type="submit">Valider</Button>
      </form>
    </div>
  );
}
