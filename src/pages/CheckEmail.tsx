import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CheckEmail() {
  const query = useQuery();
  const email = query.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl">
            ✉️
          </div>
          <CardTitle className="text-2xl">Confirma tu correo</CardTitle>
          <CardDescription>
            Te hemos enviado un email para verificar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Revisa tu bandeja de entrada{email ? ` en ${email}` : ''} y haz clic en el enlace de confirmación.
          </p>
          <p>
            Si no lo ves, mira en spam o promociones.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Una vez confirmado, ya podrás entrar.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
