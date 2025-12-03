"""
Unit tests for server utility functions.
"""
class TestHashUserId:
    """Tests for the hash_user_id function."""

    def test_hash_user_id_returns_consistent_hash(self):
        """Test that the same input always produces the same hash."""
        from cairo_coder.server.app import hash_user_id

        user_id = "test-user-123"
        hash1 = hash_user_id(user_id)
        hash2 = hash_user_id(user_id)

        assert hash1 == hash2
        assert len(hash1) == 32  # Truncated to 32 chars

    def test_hash_user_id_returns_none_for_none_input(self):
        """Test that None input returns None."""
        from cairo_coder.server.app import hash_user_id

        result = hash_user_id(None)
        assert result is None

    def test_hash_user_id_returns_hash_for_empty_string(self):
        """Test that empty string input returns a hash."""
        from cairo_coder.server.app import hash_user_id

        result = hash_user_id("")
        assert result == "e3b0c44298fc1c149afbf4c8996fb924"
