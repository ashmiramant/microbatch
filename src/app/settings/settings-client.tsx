"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getOrderFormAvailability,
  setOrderFormAvailability,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const [isPending, startTransition] = useTransition();
  const [orderFormOpen, setOrderFormOpen] = useState<boolean | null>(null);
  const [orderFormMessage, setOrderFormMessage] = useState("");
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [defaultTemplate, setDefaultTemplate] = useState("standard");
  const [defaultBakeTime, setDefaultBakeTime] = useState("45");

  useEffect(() => {
    startTransition(async () => {
      const result = await getOrderFormAvailability();
      setOrderFormOpen(result.data ?? false);
      if (!result.success) {
        setOrderFormMessage("Could not load current status. You can still try again.");
      }
    });
  }, []);

  function updateOrderFormStatus(nextValue: boolean) {
    setOrderFormMessage("");
    startTransition(async () => {
      const result = await setOrderFormAvailability(nextValue);
      if (!result.success) {
        setOrderFormMessage("Could not save right now. Please try again.");
        return;
      }
      setOrderFormOpen(nextValue);
      setOrderFormMessage(
        nextValue
          ? "Order form is now ON. Customers can submit new orders."
          : "Order form is now OFF. Customers will see the closed message."
      );
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Form Availability</CardTitle>
          <CardDescription>
            Quickly turn customer ordering on or off whenever you want.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => updateOrderFormStatus(true)}
              disabled={isPending || orderFormOpen === true}
            >
              Turn Order Form On
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => updateOrderFormStatus(false)}
              disabled={isPending || orderFormOpen === false}
            >
              Turn Order Form Off
            </Button>
            <Badge variant={orderFormOpen ? "success" : "secondary"}>
              {orderFormOpen ? "Currently ON" : "Currently OFF"}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            {orderFormOpen
              ? "Customers will see the order form and can submit orders."
              : "Customers will see your weekly closed message page."}
          </p>
          {orderFormMessage ? (
            <p className="mt-2 text-sm text-text-secondary">{orderFormMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Default Units */}
      <Card>
        <CardHeader>
          <CardTitle>Default Units</CardTitle>
          <CardDescription>
            Choose your preferred measurement system for display throughout the
            app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-background p-1">
              <button
                onClick={() => setUnitSystem("metric")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  unitSystem === "metric"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Metric (g / mL)
              </button>
              <button
                onClick={() => setUnitSystem("imperial")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  unitSystem === "imperial"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Imperial (oz / cups)
              </button>
            </div>
            <span className="text-sm text-text-secondary">
              Currently using{" "}
              <span className="font-medium text-text-primary">
                {unitSystem === "metric" ? "metric" : "imperial"}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Defaults</CardTitle>
          <CardDescription>
            Set default values for sourdough timeline generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="template">Default Sourdough Template</Label>
              <Select
                value={defaultTemplate}
                onValueChange={setDefaultTemplate}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    Standard (same-day bake)
                  </SelectItem>
                  <SelectItem value="cold_retard">
                    Cold Retard (overnight)
                  </SelectItem>
                  <SelectItem value="weekend">
                    Weekend (2-day process)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bake-time">Default Bake Time (min)</Label>
              <Select value={defaultBakeTime} onValueChange={setDefaultBakeTime}>
                <SelectTrigger id="bake-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="35">35 minutes</SelectItem>
                  <SelectItem value="40">40 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            These defaults are used when generating new sourdough timelines.
            Individual recipes can override these settings.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            Application information and version details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Application</span>
              <span className="font-serif font-semibold text-text-primary">
                MicroBatch
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Version</span>
              <Badge variant="secondary">0.1.0 MVP</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Description</span>
              <span className="text-sm text-text-primary">
                Micro-bakery production management
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
