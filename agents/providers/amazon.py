"""Invoice provider implementation for Amazon purchases."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ..qonto import Expense
from .base import InvoiceProvider


@dataclass
class AmazonInvoiceProvider(InvoiceProvider):
    """Retrieve invoices for purchases made on Amazon."""

    name: str = "amazon"
    seller_id: Optional[str] = None

    def request_invoice(self, expense: Expense) -> str:
        """Return the URL where the invoice can be downloaded.

        A real implementation would use Amazon's APIs or scraping mechanisms to
        retrieve the invoice document. Here we simply fabricate a URL so the
        application can operate end-to-end without external dependencies.
        """

        seller = self.seller_id or "default"
        return f"https://amazon.example.com/invoices/{seller}/{expense.id}.pdf"


__all__ = ["AmazonInvoiceProvider"]
