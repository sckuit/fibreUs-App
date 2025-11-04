import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Plus, Edit } from "lucide-react";
import type { Project, User, Client } from "@shared/schema";

interface ProjectsManagerProps {
  role: string;
  onEditProject?: (project: Project) => void;
  onCreateProject?: () => void;
  hasManagePermission: boolean;
}

export default function ProjectsManager({ role, onEditProject, onCreateProject, hasManagePermission }: ProjectsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch users for technician names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch clients for client names
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;

    const lowerSearch = searchTerm.toLowerCase();
    
    return projects.filter((project) => {
      // Get related data
      const client = clients.find(c => c.id === project.clientId);
      const technician = users.find(u => u.id === project.assignedTechnicianId);
      const clientName = client ? `${client.companyName || ''} ${client.contactName || ''}`.trim() : '';
      const technicianName = technician ? `${technician.firstName || ''} ${technician.lastName || ''}`.trim() : '';

      return (
        (project.ticketNumber?.toLowerCase() || '').includes(lowerSearch) ||
        (project.projectName?.toLowerCase() || '').includes(lowerSearch) ||
        (project.status?.toLowerCase() || '').includes(lowerSearch) ||
        clientName.toLowerCase().includes(lowerSearch) ||
        technicianName.toLowerCase().includes(lowerSearch) ||
        (project.serviceType?.toLowerCase() || '').includes(lowerSearch)
      );
    });
  }, [projects, searchTerm, clients, users]);

  // Paginate filtered projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startResult = filteredProjects.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, filteredProjects.length);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (projectsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">Loading projects...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
        <div>
          <CardTitle>Projects Overview</CardTitle>
          <CardDescription>
            {role === 'admin' || role === 'manager' ? 'All project records' : 'Your assigned projects'}
          </CardDescription>
        </div>
        {hasManagePermission && onCreateProject && (
          <Button onClick={onCreateProject} data-testid="button-create-project">
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ticket #, project name, status, client, technician, or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-projects"
          />
        </div>

        {/* Projects Table */}
        {filteredProjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? "No projects found matching your search" : "No projects found"}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  {hasManagePermission && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => {
                  const client = clients.find(c => c.id === project.clientId);
                  const technician = users.find(u => u.id === project.assignedTechnicianId);

                  return (
                    <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-ticket-${project.ticketNumber}`}>
                          {project.ticketNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{project.projectName || '-'}</TableCell>
                      <TableCell>
                        {client ? (client.companyName || client.contactName || '-') : '-'}
                      </TableCell>
                      <TableCell>
                        {technician ? `${technician.firstName || ''} ${technician.lastName || ''}`.trim() || '-' : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        {project.serviceType ? (
                          <span className="text-sm capitalize">{project.serviceType.replace('_', ' ')}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" data-testid={`badge-status-${project.id}`}>
                          {(project.status || 'pending').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                      </TableCell>
                      {hasManagePermission && (
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEditProject?.(project)} 
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-muted-foreground">
                Showing {startResult}-{endResult} of {filteredProjects.length} results
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px]" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
