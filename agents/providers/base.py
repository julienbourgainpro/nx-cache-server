"""Base classes and interfaces for invoice providers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Protocol

from ..qonto import Expense


class InvoiceProvider(ABC):
    """Abstract base class for an invoice provider."""

    name: str

    @abstractmethod
    def request_invoice(self, expense: Expense) -> str:
        """Return a download URL for the invoice matching ``expense``."""


class SupportsInvoiceLookup(Protocol):
    """Protocol documenting the required interface for invoice lookups."""

    def request_invoice(self, expense: Expense) -> str:
        """Retrieve the invoice for ``expense`` and return its download URL."""


__all__ = ["InvoiceProvider", "SupportsInvoiceLookup"]
