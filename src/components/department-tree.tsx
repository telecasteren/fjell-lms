"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Building2, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type DepartmentTreeNode = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  parentDepartment: { id: string; name: string } | null;
  _count: {
    users: number;
    courses: number;
  };
  progress?: {
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
  };
  children?: DepartmentTreeNode[];
};

interface DepartmentTreeProps {
  departments: DepartmentTreeNode[];
  onDepartmentSelect?: (departmentId: string) => void;
  selectedDepartmentId?: string;
}

/**
 * Builds a hierarchical tree structure from a flat list of departments
 */
function buildDepartmentTree(
  departments: DepartmentTreeNode[]
): DepartmentTreeNode[] {
  // Create a map for quick lookup
  const departmentMap = new Map<string, DepartmentTreeNode>();
  const rootDepartments: DepartmentTreeNode[] = [];

  // First pass: create nodes and map them
  departments.forEach(dept => {
    departmentMap.set(dept.id, { ...dept, children: [] });
  });

  // Second pass: build the tree
  departments.forEach(dept => {
    const node = departmentMap.get(dept.id)!;
    if (dept.parentDepartmentId) {
      const parent = departmentMap.get(dept.parentDepartmentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        // Parent not found in list, treat as root
        rootDepartments.push(node);
      }
    } else {
      // No parent, it's a root department
      rootDepartments.push(node);
    }
  });

  // Sort children by name
  const sortChildren = (nodes: DepartmentTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(rootDepartments);
  return rootDepartments;
}

interface TreeNodeProps {
  node: DepartmentTreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onDepartmentSelect?: (departmentId: string) => void;
  selectedDepartmentId?: string;
}

function TreeNode({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  onDepartmentSelect,
  selectedDepartmentId,
}: TreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedDepartmentId === node.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
          isSelected && "bg-primary/10 border border-primary/20"
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => {
          if (hasChildren) {
            onToggleExpand(node.id);
          }
          onDepartmentSelect?.(node.id);
        }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" /> // Spacer for alignment
        )}
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium flex-1">{node.name}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {node._count.users}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {node._count.courses}
          </Badge>
          {node.progress && (
            <Badge variant="secondary" className="text-xs">
              {node.progress.completionRate}%
            </Badge>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onDepartmentSelect={onDepartmentSelect}
              selectedDepartmentId={selectedDepartmentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DepartmentTree({
  departments,
  onDepartmentSelect,
  selectedDepartmentId,
}: DepartmentTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build the tree structure
  const tree = buildDepartmentTree(departments);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all by default
  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: DepartmentTreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (tree.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No departments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Department Hierarchy</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
            >
              Collapse All
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {tree.map(rootNode => (
            <TreeNode
              key={rootNode.id}
              node={rootNode}
              level={0}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleExpand}
              onDepartmentSelect={onDepartmentSelect}
              selectedDepartmentId={selectedDepartmentId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

