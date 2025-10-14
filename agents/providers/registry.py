"""Registry for invoice providers."""

from __future__ import annotations

from typing import Dict, Iterable

from ..qonto import Expense
from .base import InvoiceProvider, SupportsInvoiceLookup


class ProviderRegistry:
    """Store and resolve invoice providers by name."""

    def __init__(self, providers: Iterable[InvoiceProvider] | None = None) -> None:
        self._providers: Dict[str, InvoiceProvider] = {}
        if providers:
            for provider in providers:
                self.register(provider)

    def register(self, provider: InvoiceProvider) -> None:
        """Register ``provider`` under its ``name`` attribute."""

        self._providers[provider.name] = provider

    def get(self, provider_name: str) -> SupportsInvoiceLookup:
        """Return the provider matching ``provider_name``.

        Raises:
            KeyError: if the provider has not been registered.
        """

        try:
            return self._providers[provider_name]
        except KeyError as exc:  # pragma: no cover - defensive programming
            raise KeyError(f"Unknown provider '{provider_name}'") from exc

    def request_invoice(self, provider_name: str, expense: Expense) -> str:
        """Convenience helper to request an invoice from a named provider."""

        provider = self.get(provider_name)
        return provider.request_invoice(expense)


__all__ = ["ProviderRegistry"]
