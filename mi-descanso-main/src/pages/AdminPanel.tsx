import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Save, Users, TreePine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { useAllProfiles, useUpdateProfileBirthDate, useUpdateUserRole } from '@/hooks/useProfiles';
import { useAllChristmasOptions, useUpdateChristmasOption } from '@/hooks/useVacations';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(2026);

  // Queries
  const { data: users = [], isLoading: usersLoading } = useAllProfiles();
  const { data: christmasOptions = [], isLoading: christmasLoading } = useAllChristmasOptions();

  // Mutations
  const updateBirthDate = useUpdateProfileBirthDate();
  const updateRole = useUpdateUserRole();
  const updateChristmasOption = useUpdateChristmasOption();

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/mis-vacaciones" replace />;
  }

  const handleRoleChange = (userId: string, newRole: 'admin' | 'employee') => {
    updateRole.mutate({ userId, role: newRole });
  };

  const handleBirthDateChange = (userId: string, newDate: Date) => {
    updateBirthDate.mutate({ userId, birthDate: newDate });
  };

  const yearOptions = christmasOptions.filter((o) => o.year === selectedYear);
  const optionA = yearOptions.find((o) => o.option_label === 'A');
  const optionB = yearOptions.find((o) => o.option_label === 'B');

  const handleChristmasOptionChange = (
    optionId: string,
    field: 'startDate' | 'endDate',
    newDate: Date
  ) => {
    updateChristmasOption.mutate({
      id: optionId,
      [field]: newDate,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios y configuración del sistema
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="christmas" className="gap-2">
              <TreePine className="h-4 w-4" />
              Navidad
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra los roles y datos de los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Fecha Nacimiento</TableHead>
                        <TableHead>Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  {user.birth_date
                                    ? format(new Date(user.birth_date), 'dd/MM/yyyy')
                                    : 'Sin fecha'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={user.birth_date ? new Date(user.birth_date) : undefined}
                                  onSelect={(date) => date && handleBirthDateChange(user.id, date)}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: 'admin' | 'employee') =>
                                handleRoleChange(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Empleado</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Christmas Tab */}
          <TabsContent value="christmas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuración de Navidad</CardTitle>
                    <CardDescription>
                      Define las opciones A y B para cada año
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {christmasLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Option A */}
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Badge>Opción A</Badge>
                        Primera semana
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Fecha inicio</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {optionA
                                  ? format(new Date(optionA.start_date), 'PPP', { locale: es })
                                  : 'Seleccionar'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={optionA ? new Date(optionA.start_date) : undefined}
                                onSelect={(date) =>
                                  date && optionA && handleChristmasOptionChange(optionA.id, 'startDate', date)
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha fin</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {optionA
                                  ? format(new Date(optionA.end_date), 'PPP', { locale: es })
                                  : 'Seleccionar'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={optionA ? new Date(optionA.end_date) : undefined}
                                onSelect={(date) =>
                                  date && optionA && handleChristmasOptionChange(optionA.id, 'endDate', date)
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Option B */}
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Badge variant="secondary">Opción B</Badge>
                        Segunda semana
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Fecha inicio</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {optionB
                                  ? format(new Date(optionB.start_date), 'PPP', { locale: es })
                                  : 'Seleccionar'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={optionB ? new Date(optionB.start_date) : undefined}
                                onSelect={(date) =>
                                  date && optionB && handleChristmasOptionChange(optionB.id, 'startDate', date)
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha fin</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {optionB
                                  ? format(new Date(optionB.end_date), 'PPP', { locale: es })
                                  : 'Seleccionar'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={optionB ? new Date(optionB.end_date) : undefined}
                                onSelect={(date) =>
                                  date && optionB && handleChristmasOptionChange(optionB.id, 'endDate', date)
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
