import { test } from "node:test";
import assert from "node:assert/strict";
import { MICROGREEN_PHOTO_CREDITS, primaryMicrogreenCredit, microgreenPhotoPath } from "../src/data/microgreenPhotoCredits.ts";

test("microgreenPhotoPath: kredisi olan tür için /photos/microgreens/<id>.jpg döner", () => {
  const c = MICROGREEN_PHOTO_CREDITS[0];
  assert.equal(microgreenPhotoPath(c.microgreenId), `/photos/microgreens/${c.microgreenId}.jpg`);
});

test("microgreenPhotoPath: bilinmeyen id için undefined döner", () => {
  assert.equal(microgreenPhotoPath("olmayan-tur"), undefined);
});

test("07-VERI-KAYNAKLARI-VE-KANIT.md §9: her kayıtta checksum ve tür etiketi dolu (uydurulmadan kaynak CSV'den taşındı)", () => {
  for (const c of MICROGREEN_PHOTO_CREDITS) {
    assert.match(c.checksumSha256, /^[0-9a-f]{64}$/, `${c.microgreenId}/${c.filename} checksum sha256 biçimli değil`);
    assert.equal(typeof c.checksumVerified, "boolean", `${c.microgreenId}/${c.filename} checksumVerified boolean değil`);
    assert.ok(c.speciesLabel.length > 0, `${c.microgreenId}/${c.filename} speciesLabel boş`);
    assert.ok(c.license.length > 0, `${c.microgreenId}/${c.filename} lisans boş`);
    assert.ok(c.attributionText.length > 0, `${c.microgreenId}/${c.filename} atıf metni boş`);
  }
});

test("primaryMicrogreenCredit: her kayıt tam olarak bir microgreenId'ye ait (yinelenen birincil yok)", () => {
  const ids = MICROGREEN_PHOTO_CREDITS.map((c) => c.microgreenId);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.ok(primaryMicrogreenCredit(id));
  }
});
