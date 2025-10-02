import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryItem } from "@shared/schema";

interface InventoryDialogProps {
  item?: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (itemData: any) => void;
  isPending: boolean;
}

const categories = [
  "cameras", "dvr_nvr", "monitors", "cables", "connectors",
  "alarms", "sensors", "keypads", "access_control", "intercoms",
  "fiber_optic", "network_equipment", "tools", "mounting", "power_supplies", "other"
];

const unitOfMeasureOptions = [
  "piece", "box", "roll", "meter", "foot", "pair", "set", "kit"
];

export function InventoryDialog({ item, open, onOpenChange, onSubmit, isPending }: InventoryDialogProps) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "other",
    unitOfMeasure: "piece",
    quantityInStock: 0,
    minimumStockLevel: 0,
    unitCost: "",
    unitPrice: "",
    supplier: "",
    location: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        sku: item?.sku || "",
        name: item?.name || "",
        description: item?.description || "",
        category: item?.category || "other",
        unitOfMeasure: item?.unitOfMeasure || "piece",
        quantityInStock: item?.quantityInStock || 0,
        minimumStockLevel: item?.minimumStockLevel || 0,
        unitCost: item?.unitCost || "",
        unitPrice: item?.unitPrice || "",
        supplier: item?.supplier || "",
        location: item?.location || "",
      });
    }
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
    };
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-inventory">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
            <DialogDescription>
              {item
                ? "Update inventory item information"
                : "Add a new item to inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                className="col-span-3"
                required
                data-testid="input-sku"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
                data-testid="input-name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitOfMeasure" className="text-right">
                Unit
              </Label>
              <Select
                value={formData.unitOfMeasure}
                onValueChange={(value) => handleChange("unitOfMeasure", value)}
              >
                <SelectTrigger className="col-span-3" data-testid="select-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOfMeasureOptions.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantityInStock" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantityInStock"
                type="number"
                value={formData.quantityInStock}
                onChange={(e) => handleChange("quantityInStock", parseInt(e.target.value))}
                className="col-span-3"
                required
                data-testid="input-quantity"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minimumStockLevel" className="text-right">
                Min Stock
              </Label>
              <Input
                id="minimumStockLevel"
                type="number"
                value={formData.minimumStockLevel}
                onChange={(e) => handleChange("minimumStockLevel", parseInt(e.target.value))}
                className="col-span-3"
                data-testid="input-min-stock"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitCost" className="text-right">
                Unit Cost
              </Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => handleChange("unitCost", e.target.value)}
                className="col-span-3"
                data-testid="input-unit-cost"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitPrice" className="text-right">
                Unit Price
              </Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
                className="col-span-3"
                data-testid="input-unit-price"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier
              </Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                className="col-span-3"
                data-testid="input-supplier"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="col-span-3"
                data-testid="input-location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? "Saving..." : item ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
