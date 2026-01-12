import { productQueries } from "@/entities/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface ProductTableProps {
  search: string;
}

export function ProductTable({ search }: ProductTableProps) {
  const { data: products, isLoading } = productQueries.useAll();
  const deleteMutation = productQueries.useDelete();

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="animate-pulse border-border">
              <TableCell colSpan={7}>
                <div className="h-12 w-full rounded bg-muted"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!filteredProducts?.length) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground">
        No products found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Variants</TableHead>
          <TableHead>Price Range</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredProducts.map((product) => {
          const prices = product.variants.map((v) => Number(v.sellPrice));
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          return (
            <TableRow key={product.id} className="border-border">
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase"
                >
                  {product.type}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.category.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.brand.name}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((v) => (
                    <Badge
                      key={v.id}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {v.sku}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {minPrice === maxPrice
                  ? `$${minPrice.toLocaleString()}`
                  : `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this product?"
                          )
                        ) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
