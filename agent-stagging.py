"""Command line interface for the expense justification agent."""

from __future__ import annotations

import argparse
import logging
import os
from typing import Iterable

from agents import ProviderRegistry, QontoClient
from agents.providers.amazon import AmazonInvoiceProvider

logger = logging.getLogger(__name__)


def configure_logging(verbose: bool) -> None:
    """Configure basic logging for the CLI."""

    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging output.",
    )
    parser.add_argument(
        "--provider",
        default="amazon",
        help="Name of the invoice provider to use for missing expenses.",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def build_qonto_client() -> QontoClient:
    """Construct a :class:`QontoClient` using environment variables."""

    api_key = os.environ.get("QONTO_API_KEY", "dummy-key")
    organization = os.environ.get("QONTO_ORGANIZATION", "example-org")
    return QontoClient(api_key=api_key, organization=organization)


def build_provider_registry() -> ProviderRegistry:
    """Create a registry with the known invoice providers."""

    registry = ProviderRegistry()
    registry.register(AmazonInvoiceProvider())
    return registry


def main(argv: Iterable[str] | None = None) -> int:
    """Entry point for the command line utility."""

    args = parse_args(argv)
    configure_logging(args.verbose)

    logger.info("Starting expense justification agent")
    qonto_client = build_qonto_client()
    registry = build_provider_registry()

    expenses = qonto_client.fetch_expenses()
    missing_expenses = qonto_client.filter_missing_expenses(expenses)
    if not missing_expenses:
        logger.info("All expenses are already justified.")
        return 0

    logger.info("Found %s expenses without justification", len(missing_expenses))

    for expense in missing_expenses:
        try:
            invoice_url = registry.request_invoice(args.provider, expense)
        except KeyError:
            logger.error("Unknown provider '%s'", args.provider)
            return 1

        logger.info(
            "Expense %s from %s: invoice available at %s",
            expense.id,
            expense.merchant,
            invoice_url,
        )

    logger.info("Processing completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
